import { generateSummary, generateSummaryFromQuestions } from "@/lib/llmClient";
import { LIMITS, rateLimit, readLimitedJson, truncateText } from "@/lib/security";

export async function POST(request) {
  try {
    const limited = rateLimit(request, "summary", {
      limit: 20,
      windowMs: 10 * 60 * 1000
    });
    if (limited) return limited;

    const body = await readLimitedJson(request);
    const questions = Array.isArray(body.questions) ? body.questions : null;

    if (questions) {
      const trimmedQuestions = questions.map((question, index) => ({
        ...question,
        question_id: String(question.question_id || `Q${index + 1}`),
        question: truncateText(question.question, LIMITS.maxQuestionChars),
        turns: Array.isArray(question.turns)
          ? question.turns.slice(-10).map((turn) => ({
              ...turn,
              text: truncateText(turn.text || turn.question, LIMITS.maxAnswerChars)
            }))
          : []
      }));
      const hasParticipantText = trimmedQuestions.some((question) =>
        (question.turns || []).some(
          (turn) => turn.role === "participant" && String(turn.text || "").trim()
        )
      );

      if (!hasParticipantText) {
        return Response.json(
          { error: "At least one participant answer is required" },
          { status: 400 }
        );
      }

      const summary = await generateSummaryFromQuestions(trimmedQuestions);
      return Response.json(normaliseSummary(summary));
    }

    const answer1 = truncateText(body.answer_1, LIMITS.maxAnswerChars);
    const followupQuestion = truncateText(body.follow_up_question, LIMITS.maxQuestionChars);
    const answer2 = truncateText(body.answer_2, LIMITS.maxAnswerChars);

    if (!answer1 || !followupQuestion || !answer2) {
      return Response.json(
        { error: "questions or answer_1, follow_up_question, and answer_2 are required" },
        { status: 400 }
      );
    }

    const summary = await generateSummary(answer1, followupQuestion, answer2);
    return Response.json(normaliseSummary(summary));
  } catch (error) {
    return Response.json(
      { error: error.message || "Could not generate summary" },
      { status: error.status || 500 }
    );
  }
}

function normaliseSummary(summary) {
  return {
    main_theme: truncateText(summary.main_theme || "Hackathon feedback", 180),
    barrier_or_need: truncateText(summary.barrier_or_need || "Needs clearer support", 240),
    suggested_improvement: truncateText(
      summary.suggested_improvement || "Clarify the most useful next improvement.",
      240
    ),
    neutral_summary: truncateText(summary.neutral_summary, LIMITS.maxSummaryChars),
    sensitive_data_flag: Boolean(summary.sensitive_data_flag),
    model_provider: String(summary.model_provider || "unknown"),
    model_name: String(summary.model_name || ""),
    question_summaries: Array.isArray(summary.question_summaries)
      ? summary.question_summaries.map((item) => ({
          question_id: String(item.question_id || ""),
          theme: truncateText(item.theme, 180),
          summary: truncateText(item.summary, 500)
        }))
      : []
  };
}
