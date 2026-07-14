import { DEFAULT_MODEL } from "./constants";
import { generateFallbackFollowup } from "./fallbackInterview";

const DEFAULT_HF_MODEL = "openai/gpt-oss-120b:fastest";

function flattenQuestionText(questions) {
  return questions
    .map((question) => {
      const turns = (question.turns || [])
        .filter((turn) => turn.role === "participant")
        .map((turn) => `${turn.role}: ${turn.text || turn.question || ""}`)
        .join("\n");
      return `${question.question_id}: ${turns}`;
    })
    .join("\n\n");
}

function keywordTheme(text) {
  const lower = text.toLowerCase();
  if (lower.includes("housing") || lower.includes("rent")) return "Housing data and affordability";
  if (lower.includes("transport") || lower.includes("bus") || lower.includes("travel")) {
    return "Transport access and reliability";
  }
  if (lower.includes("energy") || lower.includes("heat") || lower.includes("climate")) {
    return "Energy and environmental data";
  }
  if (lower.includes("local") || lower.includes("regional") || lower.includes("europe")) {
    return "Responsibility across levels";
  }
  if (lower.includes("trust") || lower.includes("transparent") || lower.includes("explain")) {
    return "Trust and transparency";
  }
  if (lower.includes("ai") || lower.includes("pattern") || lower.includes("human")) {
    return "Human oversight of AI patterns";
  }
  return "Public data and collective understanding";
}

function fallbackSummary(questions) {
  const combined = flattenQuestionText(questions);
  const main_theme = keywordTheme(combined);
  let barrier_or_need = "People need public data that is understandable and connected to a practical decision.";
  let suggested_improvement = "Make the relevant data, responsibility, and limits of the interpretation visible.";

  if (main_theme === "Housing data and affordability") {
    barrier_or_need = "People need comparable local evidence about housing costs and affordability.";
    suggested_improvement = "Connect regularly updated housing data to accountable local decisions.";
  } else if (main_theme === "Transport access and reliability") {
    barrier_or_need = "Route data may not reveal whether people can reliably reach jobs and services.";
    suggested_improvement = "Measure travel time and reliability alongside service coverage.";
  } else if (main_theme === "Responsibility across levels") {
    barrier_or_need = "It can be unclear which level should set standards, act, and remain accountable.";
    suggested_improvement = "Use shared standards while keeping decisions close to affected communities.";
  } else if (main_theme === "Trust and transparency") {
    barrier_or_need = "AI-derived patterns are hard to trust when sources, uncertainty, or correction paths are hidden.";
    suggested_improvement = "Show sources and uncertainty, and let people challenge a misleading pattern.";
  } else if (main_theme === "Human oversight of AI patterns") {
    barrier_or_need = "Pattern finding can be useful without being a legitimate final decision.";
    suggested_improvement = "Keep judgement with accountable humans and affected communities.";
  }

  const question_summaries = questions.map((question) => {
    const participantText = (question.turns || [])
      .filter((turn) => turn.role === "participant")
      .map((turn) => String(turn.text || "").trim())
      .filter(Boolean)
      .join(" ");
    return {
      question_id: question.question_id,
      theme: keywordTheme(participantText),
      summary: participantText.slice(0, 500)
    };
  });
  const neutralSummary = question_summaries
    .map((item) => item.summary)
    .filter(Boolean)
    .join(" ")
    .slice(0, 900);

  return {
    main_theme,
    barrier_or_need,
    suggested_improvement,
    neutral_summary: neutralSummary ||
      `The participant's answers point to ${main_theme.toLowerCase()}. The main need is: ${barrier_or_need}`,
    sensitive_data_flag: false,
    question_summaries,
    model_provider: "local-fallback",
    model_name: "deepask-evidence-summary-v1"
  };
}

function extractJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Model did not return JSON.");
    return JSON.parse(match[0]);
  }
}

function providerConfig() {
  const requestedProvider = (process.env.LLM_PROVIDER || "").toLowerCase();

  if (requestedProvider === "huggingface") {
    if (!process.env.HF_TOKEN) {
      throw new Error("HF_TOKEN is not configured.");
    }
    return {
      provider: "huggingface",
      model: process.env.HF_MODEL || DEFAULT_HF_MODEL,
      baseUrl: "https://router.huggingface.co/v1/chat/completions",
      token: process.env.HF_TOKEN
    };
  }

  if (requestedProvider === "openai") {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured.");
    }
    return {
      provider: "openai",
      model: DEFAULT_MODEL,
      baseUrl: "https://api.openai.com/v1/chat/completions",
      token: process.env.OPENAI_API_KEY
    };
  }

  if (process.env.OPENAI_API_KEY) {
    return {
      provider: "openai",
      model: DEFAULT_MODEL,
      baseUrl: "https://api.openai.com/v1/chat/completions",
      token: process.env.OPENAI_API_KEY
    };
  }

  if (process.env.HF_TOKEN) {
    return {
      provider: "huggingface",
      model: process.env.HF_MODEL || DEFAULT_HF_MODEL,
      baseUrl: "https://router.huggingface.co/v1/chat/completions",
      token: process.env.HF_TOKEN
    };
  }

  throw new Error("No LLM provider is configured.");
}

async function callModel(messages) {
  const config = providerConfig();

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

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`${config.provider} request failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error(`${config.provider} returned no content.`);
  return {
    result: extractJson(content),
    provider: config.provider,
    model: config.model
  };
}

export async function generateFollowup({ question, turns, latestAnswer, followupCount }) {
  const messages = [
    {
      role: "system",
      content: `You are an assistant for a civic participation interview.

Your task is to ask ONE neutral follow-up question based on the participant's latest answer.

Rules:
- Do not persuade the participant.
- Do not challenge their opinion.
- Do not introduce political arguments.
- Do not ask leading questions.
- Do not collect sensitive personal data.
- Ask only one short, clear follow-up question.
- The goal is to clarify meaning, barriers, needs, or suggested improvements.
- Use plain language.
- If the answer is already clear enough, set should_continue to false and ask a gentle optional clarification.
- If the answer contains sensitive personal data, do not repeat the sensitive details. Ask a safe, general clarification question.

Return JSON only:
{
  "theme": "...",
  "follow_up_question": "...",
  "should_continue": true_or_false
}`
    },
    {
      role: "user",
      content: `Main question:
"${question}"

Follow-ups already asked: ${followupCount}

Conversation so far:
${JSON.stringify(turns, null, 2)}

Latest participant answer:
"${latestAnswer}"`
    }
  ];

  try {
    const completion = await callModel(messages);
    return {
      ...completion.result,
      model_provider: completion.provider,
      model_name: completion.model
    };
  } catch {
    return generateFallbackFollowup({ question, latestAnswer, followupCount });
  }
}

export async function generateSummaryFromQuestions(questions) {
  const messages = [
    {
      role: "system",
      content: `You are summarising a participant's answers for a civic participation dashboard.

Rules:
- Summarise neutrally.
- Do not infer political affiliation.
- Do not diagnose, profile, or judge the person.
- Do not change the participant's meaning.
- Focus on barriers, needs, concerns, and suggested improvements.
- Do not include unnecessary personal details.
- If sensitive personal data appears, set sensitive_data_flag to true and avoid repeating the sensitive details.
- Keep the final summary short and clear.
- Preserve the distinction between original answers and AI interpretation.
- Return JSON only.

Return:
{
  "main_theme": "...",
  "barrier_or_need": "...",
  "suggested_improvement": "...",
  "neutral_summary": "...",
  "sensitive_data_flag": true_or_false,
  "question_summaries": [
    {
      "question_id": "...",
      "theme": "...",
      "summary": "..."
    }
  ]
}`
    },
    {
      role: "user",
      content: `Questionnaire conversation:
${JSON.stringify(questions, null, 2)}`
    }
  ];

  try {
    const completion = await callModel(messages);
    return {
      ...completion.result,
      model_provider: completion.provider,
      model_name: completion.model
    };
  } catch {
    return fallbackSummary(questions);
  }
}

export async function generateSummary(answer1, followupQuestion, answer2) {
  return generateSummaryFromQuestions([
    {
      question_id: "Q1",
      question: "Which public decision in Europe would benefit most from better access to reliable public data, and what is currently missing?",
      turns: [
        { role: "participant", text: answer1 },
        { role: "ai", text: followupQuestion },
        { role: "participant", text: answer2 }
      ]
    }
  ]);
}
