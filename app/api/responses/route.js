import {
  DEFAULT_MODEL,
  MODEL_PROVIDER,
  PROMPT_VERSION,
  QUESTIONNAIRE,
  SURVEY_ID
} from "@/lib/constants";
import { demoResponses } from "@/lib/demoData";
import {
  generateResponseId,
  getResponses,
  getResponsesForSurvey,
  getSurvey,
  saveResponse
} from "@/lib/storage";
import {
  LIMITS,
  assertOrganizerCode,
  rateLimit,
  readLimitedJson,
  tooSimilarResponses,
  truncateText
} from "@/lib/security";

export async function GET(request) {
  const authError = assertOrganizerCode(request);
  if (authError) return authError;
  const { searchParams } = new URL(request.url);
  const surveyId = searchParams.get("survey_id");
  const responses = surveyId ? await getResponsesForSurvey(surveyId) : await getResponses();
  return Response.json({
    responses,
    demoResponses: responses.length ? [] : demoResponses
  });
}

export async function POST(request) {
  try {
    const limited = rateLimit(request, "response-submit", {
      limit: 8,
      windowMs: 10 * 60 * 1000
    });
    if (limited) return limited;

    const body = await readLimitedJson(request);
    const responseId = await generateResponseId();
    const aiSummaryDraft = body.ai_summary_draft || {};
    const surveyId = String(body.survey_id || SURVEY_ID).trim();
    const survey = (await getSurvey(surveyId)) || {
      id: surveyId,
      questions: body.questionnaire || QUESTIONNAIRE
    };
    const questions = normaliseQuestions(body.questions, body, survey);
    const citizenEditedSummary =
      typeof body.citizen_edited_summary === "string" &&
      body.citizen_edited_summary.trim()
        ? body.citizen_edited_summary.trim()
        : null;

    const finalSummary = truncateText(
      citizenEditedSummary ||
        String(body.final_summary || aiSummaryDraft.neutral_summary || "").trim(),
      LIMITS.maxSummaryChars
    );

    const workpack = {
      response_id: responseId,
      survey_id: survey.id,
      questionnaire: survey.questions || body.questionnaire || QUESTIONNAIRE,
      questions,
      ai_summary_draft: normaliseSummary(aiSummaryDraft),
      citizen_confirmed_summary: Boolean(body.citizen_confirmed_summary),
      citizen_edited_summary: citizenEditedSummary,
      final_summary: finalSummary,
      prompt_version: PROMPT_VERSION,
      model_provider: String(aiSummaryDraft.model_provider || "").trim() ||
        (process.env.OPENAI_API_KEY ? MODEL_PROVIDER : "demo"),
      model_name: String(aiSummaryDraft.model_name || "").trim() ||
        (process.env.OPENAI_API_KEY ? DEFAULT_MODEL : "demo-fallback"),
      created_at: new Date().toISOString()
    };

    addLegacyCompatibilityFields(workpack, body);

    if (!hasParticipantText(workpack.questions) || !workpack.final_summary) {
      return Response.json(
        { error: "Incomplete response workpack" },
        { status: 400 }
      );
    }

    if (!questionsHaveRequiredFollowup(workpack.questions)) {
      return Response.json(
        { error: "Each answered question must include at least one answered follow-up" },
        { status: 400 }
      );
    }

    if (tooSimilarResponses(workpack.questions)) {
      return Response.json(
        { error: "Please add distinct detail before submitting" },
        { status: 400 }
      );
    }

    await saveResponse(workpack);
    return Response.json({ workpack }, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error.message || "Could not save response" },
      { status: error.status || 500 }
    );
  }
}

function normaliseQuestions(input, body, survey) {
  if (Array.isArray(input)) {
    return input.map((question, index) => ({
      question_id: String(question.question_id || `Q${index + 1}`),
      question: truncateText(question.question, LIMITS.maxQuestionChars),
      status: String(question.status || "completed"),
      followup_count: Number(question.followup_count || 0),
      turns: Array.isArray(question.turns)
        ? question.turns.map((turn) => ({
            role: turn.role === "ai" ? "ai" : "participant",
            type: String(turn.type || (turn.role === "ai" ? "followup" : "answer")),
            text: truncateText(turn.text || turn.question, LIMITS.maxAnswerChars),
            theme: turn.theme ? String(turn.theme) : undefined,
            created_at: turn.created_at || new Date().toISOString()
          }))
        : []
    }));
  }

  return [
    {
      question_id: "Q1",
      question: survey.questions?.[0]?.question || QUESTIONNAIRE[0].question,
      status: "completed",
      followup_count: bodyFollowupCount(body),
      turns: [
        body.answer_1_original
          ? {
              role: "participant",
              type: "initial_answer",
              text: truncateText(body.answer_1_original, LIMITS.maxAnswerChars),
              created_at: new Date().toISOString()
            }
          : null,
        body.ai_followup?.follow_up_question
          ? {
              role: "ai",
              type: "followup",
              text: truncateText(body.ai_followup.follow_up_question, LIMITS.maxQuestionChars),
              theme: String(body.ai_followup.theme || ""),
              created_at: new Date().toISOString()
            }
          : null,
        body.answer_2_original
          ? {
              role: "participant",
              type: "followup_answer",
              text: truncateText(body.answer_2_original, LIMITS.maxAnswerChars),
              created_at: new Date().toISOString()
            }
          : null
      ].filter(Boolean)
    }
  ];
}

function bodyFollowupCount(input) {
  return input?.ai_followup?.follow_up_question ? 1 : 0;
}

function normaliseSummary(summary) {
  return {
    main_theme: truncateText(summary.main_theme, 180),
    barrier_or_need: truncateText(summary.barrier_or_need, 240),
    suggested_improvement: truncateText(summary.suggested_improvement, 240),
    neutral_summary: truncateText(summary.neutral_summary, LIMITS.maxSummaryChars),
    sensitive_data_flag: Boolean(summary.sensitive_data_flag),
    model_provider: summary.model_provider ? String(summary.model_provider) : undefined,
    model_name: summary.model_name ? String(summary.model_name) : undefined,
    question_summaries: Array.isArray(summary.question_summaries)
      ? summary.question_summaries.map((item) => ({
          question_id: String(item.question_id || ""),
          theme: truncateText(item.theme, 180),
          summary: truncateText(item.summary, 500)
        }))
      : []
  };
}

function hasParticipantText(questions) {
  return questions.some((question) =>
    (question.turns || []).some(
      (turn) => turn.role === "participant" && String(turn.text || "").trim()
    )
  );
}

function questionsHaveRequiredFollowup(questions) {
  return questions
    .filter((question) =>
      (question.turns || []).some(
        (turn) => turn.role === "participant" && String(turn.text || "").trim()
      )
    )
    .every((question) => {
      const turns = question.turns || [];
      const hasAiFollowup = turns.some((turn) => turn.role === "ai" && turn.type === "followup");
      const hasFollowupAnswer = turns.some(
        (turn) => turn.role === "participant" && turn.type === "followup_answer"
      );
      return hasAiFollowup && hasFollowupAnswer;
    });
}

function addLegacyCompatibilityFields(workpack, body) {
  const firstQuestion = workpack.questions[0];
  const firstTurns = firstQuestion?.turns || [];
  const firstParticipant = firstTurns.find((turn) => turn.role === "participant");
  const firstAi = firstTurns.find((turn) => turn.role === "ai");
  const secondParticipant = firstTurns
    .filter((turn) => turn.role === "participant")
    .at(1);

  workpack.question_1 =
    firstQuestion?.question || workpack.questionnaire?.[0]?.question || QUESTIONNAIRE[0].question;
  workpack.answer_1_original =
    firstParticipant?.text || String(body.answer_1_original || "").trim();
  workpack.ai_followup = {
    theme: firstAi?.theme || String(body.ai_followup?.theme || "").trim(),
    follow_up_question:
      firstAi?.text || String(body.ai_followup?.follow_up_question || "").trim()
  };
  workpack.answer_2_original =
    secondParticipant?.text || String(body.answer_2_original || "").trim();
}
