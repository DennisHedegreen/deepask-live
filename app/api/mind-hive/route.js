import { SURVEY_ID } from "@/lib/constants";
import { buildMindHiveForSurvey } from "@/lib/mindHiveData";
import {
  getMindHiveReactions,
  getResponsesForSurvey,
  responseHasRequiredFollowups,
  reactionsForSurvey
} from "@/lib/storage";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const surveyId = searchParams.get("survey_id") || SURVEY_ID;
  const responses = (await getResponsesForSurvey(surveyId)).filter(responseHasRequiredFollowups);
  const allReactions = await getMindHiveReactions();
  const reactions = reactionsForSurvey(allReactions, surveyId);

  return Response.json(buildMindHiveForSurvey(surveyId, responses, reactions));
}
