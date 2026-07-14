import { getSyntheticResponsesForSurvey } from "./syntheticResponses";
import { buildMindHive } from "./mindHive";

export function buildMindHiveForSurvey(surveyId, submittedResponses, reactions = {}) {
  const syntheticResponses = getSyntheticResponsesForSurvey(surveyId);
  const responses = [...syntheticResponses, ...submittedResponses];
  const hive = buildMindHive(responses, reactions);

  return {
    hive: {
      ...hive,
      overview: {
        ...hive.overview,
        syntheticResponseCount: syntheticResponses.length,
        submittedResponseCount: submittedResponses.length
      }
    },
    usingDemo: syntheticResponses.length > 0,
    usingSynthetic: syntheticResponses.length > 0
  };
}
