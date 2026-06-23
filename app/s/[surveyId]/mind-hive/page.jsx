import { notFound } from "next/navigation";
import MindHiveView from "@/components/MindHiveView";
import { getSurvey } from "@/lib/storage";

export default async function SurveyMindHivePage({ params }) {
  const { surveyId } = await params;
  const survey = await getSurvey(surveyId);

  if (!survey) {
    notFound();
  }

  return <MindHiveView survey={survey} />;
}
