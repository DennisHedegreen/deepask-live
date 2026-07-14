export const SURVEY_ID = "public-data-possibilities";
export const PROMPT_VERSION = "v0.2";
export const MODEL_PROVIDER = "openai";
export const DEFAULT_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";
export const MAX_FOLLOWUPS_PER_QUESTION = 3;

export const QUESTIONNAIRE = [
  {
    question_id: "Q1",
    question:
      "What is one public problem that better access to data could help people understand?"
  },
  {
    question_id: "Q2",
    question:
      "How should responsibility be divided between local, regional, national, and European levels?"
  },
  {
    question_id: "Q3",
    question:
      "What would make you trust—or distrust—an AI system that turns individual answers into group patterns?"
  }
];

export const QUESTION_1 = QUESTIONNAIRE[0].question;

export const DEFAULT_SURVEY = {
  id: SURVEY_ID,
  title: "What Should Public Data Make Possible?",
  subtitle: "A short DeepAsk demonstration",
  intro:
    "Choose a question and answer in your own words. DeepAsk asks one neutral follow-up, lets you confirm the summary, and then adds it to a shared group map.",
  mode: "simple",
  followup_limit: 1,
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
