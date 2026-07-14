export const SURVEY_ID = "public-data-possibilities";
export const PROMPT_VERSION = "v0.2";
export const MODEL_PROVIDER = "openai";
export const DEFAULT_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";
export const MAX_FOLLOWUPS_PER_QUESTION = 3;

export const QUESTIONNAIRE = [
  {
    question_id: "Q1",
    question:
      "Which public decision in Europe would benefit most from better access to reliable public data, and what is currently missing?"
  },
  {
    question_id: "Q2",
    question:
      "When public data is compared across countries or regions, what should be standardised—and what must remain sensitive to local context?"
  },
  {
    question_id: "Q3",
    question:
      "What evidence, transparency, and human oversight should be required before AI-generated patterns from public responses can inform a public decision?"
  }
];

export const QUESTION_1 = QUESTIONNAIRE[0].question;

export const DEFAULT_SURVEY = {
  id: SURVEY_ID,
  title: "How Should Public Data Support Democratic Decisions?",
  subtitle: "A short DeepAsk research demonstration",
  intro:
    "Answer three questions in your own words. DeepAsk asks one required neutral follow-up and lets you choose up to two more, then you confirm the final summary before it enters the shared group map.",
  mode: "advanced",
  followup_limit: 3,
  status: "active",
  questions: QUESTIONNAIRE
};

export const SAFEGUARDS = [
  "DeepAsk asks neutral follow-up questions only.",
  "AI does not persuade or judge.",
  "After the first follow-up, the participant chooses whether to continue, up to three.",
  "Participant can confirm or edit the final summary.",
  "Original answers are kept separate from AI summaries.",
  "Dashboard shows aggregated civic signals, not personal profiles.",
  "Do not include sensitive personal information."
];
