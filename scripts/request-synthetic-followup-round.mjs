import { readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

const target = String(
  process.argv[2] ||
    process.env.DEEPASK_SYNTHETIC_TARGET ||
    "https://deepask-public-data-demo-production.up.railway.app/deepask"
).replace(/\/+$/, "");
const useDirectProvider = process.env.SYNTHETIC_DIRECT === "1";
const useLocalFallback = process.env.SYNTHETIC_LOCAL_FALLBACK === "1";
const retryFallbacks = process.env.RETRY_SYNTHETIC_FALLBACK === "1";
const retryLocalFallbacks = process.env.RETRY_SYNTHETIC_LOCAL_FALLBACK === "1";

const root = process.cwd();
const draftsPath = path.join(root, "fixtures/public-data-synthetic-drafts.json");
const transcriptsPath = path.join(root, "fixtures/public-data-synthetic-transcripts.json");
const questions = [
  "Which public decision in Europe would benefit most from better access to reliable public data, and what is currently missing?",
  "When public data is compared across countries or regions, what should be standardised—and what must remain sensitive to local context?",
  "What evidence, transparency, and human oversight should be required before AI-generated patterns from public responses can inform a public decision?"
];

const drafts = JSON.parse(await readFile(draftsPath, "utf8"));
const state = await loadState(drafts);
if (retryFallbacks) {
  for (const participant of state) {
    for (const question of participant.questions) {
      const lastTurn = question.turns.at(-1);
      if (
        lastTurn?.role === "ai" &&
        (lastTurn.model_provider === "demo" ||
          (retryLocalFallbacks && lastTurn.model_provider === "local-fallback"))
      ) {
        question.turns.pop();
      }
    }
  }
}
const pendingRequests = [];

for (const participant of state) {
  for (const question of participant.questions) {
    const followupCount = question.turns.filter(
      (turn) => turn.role === "ai" && turn.type === "followup"
    ).length;
    const lastTurn = question.turns.at(-1);
    if (
      followupCount < question.followup_target &&
      lastTurn?.role === "participant"
    ) {
      pendingRequests.push({ participant, question, followupCount, latestAnswer: lastTurn.text });
    }
  }
}

const results = await mapWithConcurrency(pendingRequests, useDirectProvider ? 1 : 4, async (item) => {
  const data = useLocalFallback
    ? await requestLocalFallback(item)
    : useDirectProvider
      ? await requestDirectFollowup(item)
      : await requestEndpointFollowup(item);
  if (["demo", "demo-fallback"].includes(data.model_provider)) {
    throw new Error(
      `${item.participant.id}/${item.question.question_id}: generic demo fallback rejected`
    );
  }
  return { item, data };
});

const now = new Date().toISOString();
for (const { item, data } of results) {
  item.question.turns.push({
    role: "ai",
    type: "followup",
    text: String(data.follow_up_question || "").trim(),
    theme: String(data.theme || "").trim(),
    should_continue: Boolean(data.should_continue),
    model_provider: String(data.model_provider || "unknown"),
    model_name: String(data.model_name || ""),
    created_at: now
  });
}

await writeJsonAtomic(transcriptsPath, state);

console.log(
  JSON.stringify(
    results.map(({ item, data }) => ({
      participant_id: item.participant.id,
      persona: item.participant.persona,
      question_id: item.question.question_id,
      followup_number: item.followupCount + 1,
      follow_up_question: data.follow_up_question,
      should_continue: Boolean(data.should_continue),
      model_provider: data.model_provider,
      model_name: data.model_name
    })),
    null,
    2
  )
);

async function loadState(sourceDrafts) {
  try {
    return JSON.parse(await readFile(transcriptsPath, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    return sourceDrafts.map((draft) => ({
      id: draft.id,
      persona: draft.persona,
      context: draft.context,
      questions: questions.map((question, index) => ({
        question_id: `Q${index + 1}`,
        question,
        followup_target: draft.followup_targets[index],
        turns: [
          {
            role: "participant",
            type: "initial_answer",
            text: draft.answers[index],
            created_at: "2026-07-15T00:00:00.000Z"
          }
        ]
      }))
    }));
  }
}

async function requestEndpointFollowup(item) {
  const response = await fetch(`${target}/api/followup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question: item.question.question,
      turns: item.question.turns,
      latest_answer: item.latestAnswer,
      followup_count: item.followupCount,
      followup_limit: 3
    })
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(
      `${item.participant.id}/${item.question.question_id}: HTTP ${response.status} ${data.error || "follow-up failed"}`
    );
  }
  return data;
}

async function requestDirectFollowup(item) {
  const config = directProviderConfig();
  const messages = [
    {
      role: "system",
      content: `You are an assistant for a civic participation interview.

Ask ONE neutral follow-up question based on the participant's latest answer.

Rules:
- Do not persuade or challenge the participant.
- Do not introduce political arguments or ask leading questions.
- Do not collect sensitive personal data.
- Ask one short, clear question that clarifies meaning, barriers, needs, evidence, or suggested improvements.
- Do not repeat a question already asked in the conversation.
- Return JSON only with theme, follow_up_question, and should_continue.`
    },
    {
      role: "user",
      content: `Main question:\n${item.question.question}\n\nFollow-ups already asked: ${item.followupCount}\n\nConversation:\n${JSON.stringify(item.question.turns, null, 2)}\n\nLatest answer:\n${item.latestAnswer}`
    }
  ];

  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(config.baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.token}`
        },
        body: JSON.stringify({
          model: config.model,
          temperature: 0.2,
          response_format: { type: "json_object" },
          messages
        })
      });
      const responseText = await response.text();
      if (!response.ok) {
        throw new Error(`${config.provider} HTTP ${response.status}: ${responseText.slice(0, 300)}`);
      }
      const payload = JSON.parse(responseText);
      const result = extractJson(payload.choices?.[0]?.message?.content || "");
      return {
        theme: result.theme,
        follow_up_question: result.follow_up_question,
        should_continue: Boolean(result.should_continue ?? true),
        model_provider: config.provider,
        model_name: config.model
      };
    } catch (error) {
      lastError = error;
      if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
    }
  }
  throw lastError;
}

async function requestLocalFallback(item) {
  const { generateFallbackFollowup } = await import("../lib/fallbackInterview.js");
  return generateFallbackFollowup({
    question: item.question.question,
    latestAnswer: item.latestAnswer,
    followupCount: item.followupCount
  });
}

function directProviderConfig() {
  if ((process.env.LLM_PROVIDER || "").toLowerCase() === "openai" || process.env.OPENAI_API_KEY) {
    if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");
    return {
      provider: "openai",
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      baseUrl: "https://api.openai.com/v1/chat/completions",
      token: process.env.OPENAI_API_KEY
    };
  }
  if (!process.env.HF_TOKEN) throw new Error("HF_TOKEN is not configured");
  return {
    provider: "huggingface",
    model: process.env.HF_MODEL || "openai/gpt-oss-120b:fastest",
    baseUrl: "https://router.huggingface.co/v1/chat/completions",
    token: process.env.HF_TOKEN
  };
}

function extractJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    const match = String(text).match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Model did not return JSON");
    return JSON.parse(match[0]);
  }
}

async function writeJsonAtomic(filePath, value) {
  const tempPath = `${filePath}.${process.pid}.tmp`;
  await writeFile(tempPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(tempPath, filePath);
}

async function mapWithConcurrency(items, concurrency, mapper) {
  const results = new Array(items.length);
  let nextIndex = 0;
  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapper(items[index], index);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker())
  );
  return results;
}
