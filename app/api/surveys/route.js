import { getSurveys, saveSurvey } from "@/lib/storage";
import { LIMITS, assertOrganizerCode, readLimitedJson } from "@/lib/security";

export async function GET() {
  const surveys = await getSurveys();
  return Response.json({ surveys });
}

export async function POST(request) {
  try {
    const body = await readLimitedJson(request);
    const authError = assertOrganizerCode(request, body);
    if (authError) return authError;
    if (Array.isArray(body.questions) && body.questions.length > LIMITS.maxQuestionsPerSurvey) {
      return Response.json(
        { error: `A survey can have at most ${LIMITS.maxQuestionsPerSurvey} questions` },
        { status: 400 }
      );
    }
    const survey = await saveSurvey(body);
    return Response.json({ survey }, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error.message || "Could not save survey" },
      { status: error.status || 500 }
    );
  }
}
