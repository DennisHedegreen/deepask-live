import { mkdir, readFile, rename, writeFile } from "fs/promises";
import path from "path";

const dataDir = path.join(process.cwd(), "data");
const surveysPath = path.join(dataDir, "surveys.json");
const responsesPath = path.join(dataDir, "responses.json");
const reactionsPath = path.join(dataDir, "mind-hive-reactions.json");
const DEFAULT_SURVEY_ID = "hackathon-comet-2026";
const MAX_RESPONSES_PER_SURVEY = 1000;
const writeQueues = new Map();

const defaultSurvey = {
  id: DEFAULT_SURVEY_ID,
  title: "DeepAsk Live",
  subtitle: "EU Civic Tech Hackathon Demo",
  intro:
    "Answer one question at a time. DeepAsk may ask a short neutral follow-up, then turns the submitted answers into a shared group map.",
  mode: "simple",
  followup_limit: 3,
  status: "active",
  questions: [
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
  ],
  created_at: "2026-06-22T00:00:00.000Z",
  updated_at: "2026-06-22T00:00:00.000Z"
};

async function ensureStorage() {
  await mkdir(dataDir, { recursive: true });
  try {
    await readFile(responsesPath, "utf8");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    await writeJsonAtomic(responsesPath, []);
  }
}

async function ensureSurveyStorage() {
  await mkdir(dataDir, { recursive: true });
  try {
    await readFile(surveysPath, "utf8");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    await writeJsonAtomic(surveysPath, [defaultSurvey]);
  }
}

async function writeJsonAtomic(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(tempPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(tempPath, filePath);
}

async function withFileWrite(filePath, operation) {
  const previous = writeQueues.get(filePath) || Promise.resolve();
  let release;
  const current = new Promise((resolve) => {
    release = resolve;
  });
  writeQueues.set(filePath, previous.then(() => current, () => current));

  try {
    await previous.catch(() => {});
    return await operation();
  } finally {
    release();
    if (writeQueues.get(filePath) === current) {
      writeQueues.delete(filePath);
    }
  }
}

export async function getSurveys() {
  await ensureSurveyStorage();
  const raw = await readFile(surveysPath, "utf8");
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? parsed.map(normaliseSurvey) : [defaultSurvey];
  } catch {
    return [defaultSurvey];
  }
}

export async function getSurvey(surveyId) {
  const surveys = await getSurveys();
  return surveys.find((survey) => survey.id === surveyId) || null;
}

export async function saveSurvey(input) {
  return withFileWrite(surveysPath, async () => {
    await ensureSurveyStorage();
    const surveys = await getSurveys();
    const now = new Date().toISOString();
    const survey = normaliseSurvey({
      ...input,
      id: slugify(input.id || input.title || `survey-${surveys.length + 1}`),
      updated_at: now,
      created_at: input.created_at || now
    });
    const index = surveys.findIndex((item) => item.id === survey.id);
    const nextSurveys =
      index >= 0
        ? surveys.map((item, itemIndex) => (itemIndex === index ? survey : item))
        : [...surveys, survey];
    await writeJsonAtomic(surveysPath, nextSurveys);
    return survey;
  });
}

function normaliseSurvey(input) {
  const questions = Array.isArray(input.questions) && input.questions.length
    ? input.questions
    : defaultSurvey.questions;
  return {
    id: slugify(input.id || DEFAULT_SURVEY_ID),
    title: String(input.title || "Untitled survey").trim(),
    subtitle: String(input.subtitle || "EU Civic Tech Survey").trim(),
    intro: String(input.intro || defaultSurvey.intro).trim(),
    mode: input.mode === "advanced" ? "advanced" : "simple",
    followup_limit: Math.max(0, Number(input.followup_limit || 3)),
    status: input.status === "draft" ? "draft" : "active",
    questions: questions
      .map((question, index) => ({
        question_id: String(question.question_id || `Q${index + 1}`).trim() || `Q${index + 1}`,
        question: String(question.question || "").trim()
      }))
      .filter((question) => question.question),
    created_at: input.created_at || new Date().toISOString(),
    updated_at: input.updated_at || new Date().toISOString()
  };
}

function slugify(value) {
  return String(value || DEFAULT_SURVEY_ID)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || DEFAULT_SURVEY_ID;
}

export async function getResponses() {
  await ensureStorage();
  const raw = await readFile(responsesPath, "utf8");
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function getResponsesForSurvey(surveyId) {
  const responses = await getResponses();
  return responses.filter(
    (response) => String(response.survey_id || DEFAULT_SURVEY_ID) === surveyId
  );
}

export function responseHasRequiredFollowups(response) {
  const questions = Array.isArray(response.questions) ? response.questions : [];
  if (questions.length) {
    const answeredQuestions = questions.filter((question) =>
      (question.turns || []).some(
        (turn) => turn.role === "participant" && String(turn.text || "").trim()
      )
    );
    return Boolean(answeredQuestions.length) && answeredQuestions.every(questionHasFollowupAnswer);
  }

  const legacyFollowup = response.ai_followup || {};
  return Boolean(
    String(response.answer_1_original || "").trim() &&
      String(legacyFollowup.follow_up_question || "").trim() &&
      String(response.answer_2_original || "").trim()
  );
}

export async function generateResponseId() {
  const responses = await getResponses();
  return nextResponseId(responses);
}

function nextResponseId(responses) {
  const max = responses.reduce((highest, response) => {
    const match = String(response.response_id || "").match(/^R-(\d+)$/);
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0);
  return `R-${String(max + 1).padStart(3, "0")}`;
}

export async function saveResponse(workpack) {
  return withFileWrite(responsesPath, async () => {
    await ensureStorage();
    const responses = await getResponses();
    const surveyId = String(workpack.survey_id || DEFAULT_SURVEY_ID);
    const surveyResponses = responses.filter(
      (response) => String(response.survey_id || DEFAULT_SURVEY_ID) === surveyId
    );
    if (surveyResponses.length >= MAX_RESPONSES_PER_SURVEY) {
      throw new Error("This survey has reached the demo response limit");
    }

    const savedWorkpack = {
      ...workpack,
      response_id: nextResponseId(responses)
    };
    responses.push(savedWorkpack);
    await writeJsonAtomic(responsesPath, responses);
    return savedWorkpack;
  });
}

async function ensureReactionsStorage() {
  await mkdir(dataDir, { recursive: true });
  try {
    await readFile(reactionsPath, "utf8");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    await writeJsonAtomic(reactionsPath, {});
  }
}

export async function getMindHiveReactions() {
  await ensureReactionsStorage();
  const raw = await readFile(reactionsPath, "utf8");
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export async function saveMindHiveReaction(surveyId, statementId, reactionType) {
  return withFileWrite(reactionsPath, async () => {
    await ensureReactionsStorage();
    const reactions = await getMindHiveReactions();
    const scopedReactions = reactions[surveyId] || {};
    const current = scopedReactions[statementId] || {};
    reactions[surveyId] = {
      ...scopedReactions,
      [statementId]: {
        ...current,
        [reactionType]: Number(current[reactionType] || 0) + 1
      }
    };
    await writeJsonAtomic(reactionsPath, reactions);
    return reactions[surveyId][statementId];
  });
}

export function reactionsForSurvey(allReactions, surveyId) {
  if (allReactions?.[surveyId]) return allReactions[surveyId];
  const flatReactionKeys = ["agree", "important", "concern", "needsDiscussion", "missingPerspective"];
  const legacyLooksFlat = Object.values(allReactions || {}).every(
    (value) =>
      value &&
      typeof value === "object" &&
      flatReactionKeys.some((key) => Object.hasOwn(value, key))
  );
  return legacyLooksFlat ? allReactions || {} : {};
}

function questionHasFollowupAnswer(question) {
  const turns = question.turns || [];
  const hasAiFollowup = turns.some(
    (turn) => turn.role === "ai" && turn.type === "followup" && String(turn.text || "").trim()
  );
  const hasFollowupAnswer = turns.some(
    (turn) =>
      turn.role === "participant" &&
      turn.type === "followup_answer" &&
      String(turn.text || "").trim()
  );
  return hasAiFollowup && hasFollowupAnswer;
}
