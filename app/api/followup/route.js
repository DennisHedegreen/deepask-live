import { MAX_FOLLOWUPS_PER_QUESTION } from "@/lib/constants";
import { generateFollowup } from "@/lib/llmClient";
import { LIMITS, rateLimit, readLimitedJson, truncateText } from "@/lib/security";

export async function POST(request) {
  try {
    const limited = rateLimit(request, "followup", {
      limit: 40,
      windowMs: 10 * 60 * 1000
    });
    if (limited) return limited;

    const body = await readLimitedJson(request);
    const question = truncateText(body.question || body.question_1, LIMITS.maxQuestionChars);
    const latestAnswer = truncateText(body.latest_answer || body.answer_1, LIMITS.maxAnswerChars);
    const turns = Array.isArray(body.turns) ? body.turns : [];
    const followupCount = Number(body.followup_count || 0);
    const followupLimit = Math.min(
      MAX_FOLLOWUPS_PER_QUESTION,
      Math.max(1, Number(body.followup_limit || MAX_FOLLOWUPS_PER_QUESTION))
    );

    if (!question || !latestAnswer) {
      return Response.json(
        { error: "question and latest_answer are required" },
        { status: 400 }
      );
    }

    if (followupCount >= followupLimit) {
      return Response.json({
        theme: "Follow-up limit reached",
        follow_up_question: "",
        should_continue: false
      });
    }

    const followup = await generateFollowup({
      question,
      turns: turns.slice(-8).map((turn) => ({
        ...turn,
        text: truncateText(turn.text || turn.question, LIMITS.maxAnswerChars)
      })),
      latestAnswer,
      followupCount
    });

    return Response.json({
      theme: String(followup.theme || "Hackathon feedback"),
      follow_up_question: String(
        followup.follow_up_question ||
          "What specific example or change would help clarify this for organisers?"
      ),
      should_continue: Boolean(followup.should_continue ?? true),
      model_provider: String(followup.model_provider || "unknown"),
      model_name: String(followup.model_name || "")
    });
  } catch (error) {
    return Response.json(
      { error: error.message || "Could not generate follow-up question" },
      { status: error.status || 500 }
    );
  }
}
