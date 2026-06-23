import { redirect } from "next/navigation";
import { getSurveys } from "@/lib/storage";

export default async function LegacyMindHiveRedirect() {
  const surveys = await getSurveys();
  const activeSurvey = surveys.find((survey) => survey.status === "active") || surveys[0];
  redirect(`/s/${activeSurvey.id}/mind-hive`);
}
