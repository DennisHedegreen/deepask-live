import { notFound } from "next/navigation";
import SurveyRunner from "@/components/SurveyRunner";
import { getSurvey } from "@/lib/storage";

export default async function SurveyPage({ params }) {
  const { surveyId } = await params;
  const survey = await getSurvey(surveyId);

  if (!survey || survey.status !== "active") {
    notFound();
  }

  return <SurveyRunner survey={survey} />;
}
