import syntheticResponses from "../fixtures/public-data-synthetic-responses.json";

export function getSyntheticResponses() {
  return syntheticResponses;
}

export function getSyntheticResponsesForSurvey(surveyId) {
  return syntheticResponses.filter(
    (response) => String(response.survey_id || "") === String(surveyId || "")
  );
}

export function isSyntheticResponse(response) {
  return response?.synthetic === true || response?.response_origin === "synthetic";
}
