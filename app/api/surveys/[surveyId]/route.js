import { getSurvey, saveSurvey } from "@/lib/storage";
import { LIMITS, assertOrganizerCode, readLimitedJson } from "@/lib/security";

export async function GET(_request, { params }) {
  const { surveyId } = await params;
  const survey = await getSurvey(surveyId);
  if (!survey) {
    return Response.json({ error: "Survey not found" }, { status: 404 });
  }
  return Response.json({ survey });
}

export async function PUT(request, { params }) {
  try {
    const { surveyId } = await params;
    const current = await getSurvey(surveyId);
    if (!current) {
      return Response.json({ error: "Survey not found" }, { status: 404 });
    }
    const body = await readLimitedJson(request);
    const authError = assertOrganizerCode(request, body);
    if (authError) return authError;
    if (Array.isArray(body.questions) && body.questions.length > LIMITS.maxQuestionsPerSurvey) {
      return Response.json(
        { error: `A survey can have at most ${LIMITS.maxQuestionsPerSurvey} questions` },
        { status: 400 }
      );
    }
    const survey = await saveSurvey({ ...current, ...body, id: surveyId });
    return Response.json({ survey });
  } catch (error) {
    return Response.json(
      { error: error.message || "Could not update survey" },
      { status: error.status || 500 }
    );
  }
}
