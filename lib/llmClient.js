import { DEFAULT_MODEL } from "./constants";

const DEFAULT_HF_MODEL = "openai/gpt-oss-120b:fastest";

function flattenQuestionText(questions) {
  return questions
    .map((question) => {
      const turns = (question.turns || [])
        .map((turn) => `${turn.role}: ${turn.text || turn.question || ""}`)
        .join("\n");
      return `${question.question_id}: ${question.question}\n${turns}`;
    })
    .join("\n\n");
}

function keywordTheme(text) {
  const lower = text.toLowerCase();
  if (lower.includes("clear") || lower.includes("unclear")) return "Clearer challenge framing";
  if (lower.includes("support") || lower.includes("technical") || lower.includes("api")) {
    return "Need better technical support";
  }
  if (lower.includes("team") || lower.includes("inclusive") || lower.includes("alone")) {
    return "More inclusive team formation";
  }
  if (lower.includes("decision") || lower.includes("process")) return "Unclear decision process";
  if (lower.includes("build") || lower.includes("discussion")) return "More building time";
  return "Hackathon usefulness";
}

function fallbackFollowup({ question, latestAnswer }) {
  const theme = keywordTheme(`${question} ${latestAnswer}`);
  return {
    theme,
    follow_up_question:
      "What specific example or change would help clarify this for organisers?",
    should_continue: true,
    model_provider: "demo",
    model_name: "demo-fallback"
  };
}

function fallbackSummary(questions) {
  const combined = flattenQuestionText(questions);
  const main_theme = keywordTheme(combined);
  let barrier_or_need = "Participants need clearer support to make the event useful.";
  let suggested_improvement = "Clarify the next practical change participants would value most.";

  if (main_theme === "Clearer challenge framing") {
    barrier_or_need = "The expected outcome or process is not clear enough.";
    suggested_improvement = "State the expected outcome, decision process, and success criteria earlier.";
  } else if (main_theme === "Need better technical support") {
    barrier_or_need = "Teams may lose time on technical setup or deployment.";
    suggested_improvement = "Provide visible technical support for API, deployment, and setup questions.";
  } else if (main_theme === "More inclusive team formation") {
    barrier_or_need = "Participants without existing groups may struggle to join a team.";
    suggested_improvement = "Use structured team matching based on skills, roles, and interests.";
  } else if (main_theme === "More building time") {
    barrier_or_need = "Too much time may be spent discussing instead of producing a working prototype.";
    suggested_improvement = "Protect more focused build time after the problem has been framed.";
  }

  return {
    main_theme,
    barrier_or_need,
    suggested_improvement,
    neutral_summary:
      `The participant's answers point to ${main_theme.toLowerCase()}. The main need is: ${barrier_or_need}`,
    sensitive_data_flag: false,
    question_summaries: questions.map((question) => ({
      question_id: question.question_id,
      theme: keywordTheme(`${question.question} ${JSON.stringify(question.turns || [])}`),
      summary: `Response captured for ${question.question_id}.`
    })),
    model_provider: "demo",
    model_name: "demo-fallback"
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
    return fallbackFollowup({ question, latestAnswer });
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
      question: "What would make this hackathon more useful, inclusive, or meaningful for you?",
      turns: [
        { role: "participant", text: answer1 },
        { role: "ai", text: followupQuestion },
        { role: "participant", text: answer2 }
      ]
    }
  ]);
}
