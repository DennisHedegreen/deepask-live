import { buildMindHive } from "@/lib/mindHive";
import {
  getMindHiveReactions,
  getResponsesForSurvey,
  responseHasRequiredFollowups,
  reactionsForSurvey
} from "@/lib/storage";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const surveyId = searchParams.get("survey_id") || "hackathon-comet-2026";
  const responses = (await getResponsesForSurvey(surveyId)).filter(responseHasRequiredFollowups);
  const allReactions = await getMindHiveReactions();
  const reactions = reactionsForSurvey(allReactions, surveyId);

  return Response.json({
    hive: buildMindHive(responses, reactions),
    usingDemo: false
  });
}
