import { REACTION_TYPES, buildMindHive } from "@/lib/mindHive";
import {
  getMindHiveReactions,
  getResponsesForSurvey,
  responseHasRequiredFollowups,
  reactionsForSurvey,
  saveMindHiveReaction
} from "@/lib/storage";
import { rateLimit, readLimitedJson, truncateText } from "@/lib/security";

export async function POST(request) {
  try {
    const limited = rateLimit(request, "mind-hive-reaction", {
      limit: 30,
      windowMs: 10 * 60 * 1000
    });
    if (limited) return limited;

    const body = await readLimitedJson(request, 10_000);
    const surveyId = String(body.survey_id || "hackathon-comet-2026").trim();
    const statementId = truncateText(body.statement_id, 120);
    const reactionType = String(body.reaction_type || "").trim();
    const participantToken = String(body.participant_token || "").trim();

    if (!statementId || !REACTION_TYPES.includes(reactionType) || !participantToken) {
      return Response.json(
        { error: "statement_id, participant_token, and valid reaction_type are required" },
        { status: 400 }
      );
    }

    await saveMindHiveReaction(surveyId, statementId, reactionType, participantToken);
    const responses = (await getResponsesForSurvey(surveyId)).filter(responseHasRequiredFollowups);
    const allReactions = await getMindHiveReactions();
    const reactions = reactionsForSurvey(allReactions, surveyId);

    return Response.json({
      reactions: reactions[statementId] || {},
      hive: buildMindHive(responses, reactions)
    });
  } catch (error) {
    return Response.json(
      { error: error.message || "Could not save reaction" },
      { status: error.status || 500 }
    );
  }
}
