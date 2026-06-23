export const SURVEY_ID = "hackathon-comet-2026";
export const PROMPT_VERSION = "v0.2";
export const MODEL_PROVIDER = "openai";
export const DEFAULT_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";
export const MAX_FOLLOWUPS_PER_QUESTION = 3;

export const QUESTIONNAIRE = [
  {
    question_id: "Q1",
    question:
      "What would make this hackathon more useful, inclusive, or meaningful for you?"
  },
  {
    question_id: "Q2",
    question: "What barriers made it harder to contribute today?"
  },
  {
    question_id: "Q3",
    question: "What should organisers change before the next event?"
  }
];

export const QUESTION_1 = QUESTIONNAIRE[0].question;

export const DEFAULT_SURVEY = {
  id: SURVEY_ID,
  title: "DeepAsk Live",
  subtitle: "Paradogs · Yes, but no",
  intro:
    "Answer one question at a time. DeepAsk may ask a short neutral follow-up, then turns the submitted answers into a shared group map.",
  mode: "simple",
  followup_limit: MAX_FOLLOWUPS_PER_QUESTION,
  status: "active",
  questions: QUESTIONNAIRE
};

export const SAFEGUARDS = [
  "AI asks neutral follow-up questions only.",
  "AI does not persuade or judge.",
  "Participant can move to the next question or finish at any time.",
  "Participant can confirm or edit the final summary.",
  "Original answers are kept separate from AI summaries.",
  "Dashboard shows aggregated civic signals, not personal profiles.",
  "Do not include sensitive personal information."
];
