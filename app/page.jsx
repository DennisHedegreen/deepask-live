import Link from "next/link";
import { getSurveys } from "@/lib/storage";

export const dynamic = "force-dynamic";

export default async function Home() {
  const surveys = await getSurveys();
  const activeSurvey = surveys.find((survey) => survey.status === "active") || surveys[0];

  return (
    <main className="page">
      <div className="shell">
        <header className="topbar">
          <div className="brand">
            <strong>DeepAsk</strong>
            <span>Public data demo</span>
          </div>
        </header>

        <section className="hero">
          <p className="eyebrow">A short public-data demonstration</p>
          <h1>DeepAsk</h1>
          <p className="lede">
            Answer a public-data question in your own words. DeepAsk asks one
            neutral follow-up, lets you approve the summary, and adds it to a
            collective map without publishing your raw answer.
          </p>
          <div className="pill-list" style={{ marginTop: 22 }}>
            <span className="pill">Private answers</span>
            <span className="pill">Collective patterns</span>
            <span className="pill">Human oversight</span>
          </div>
          <div className="actions" style={{ marginTop: 28 }}>
            <Link className="button" href={`/s/${activeSurvey.id}`}>
              Take the survey
            </Link>
            <Link className="button secondary" href="/help">
              Help
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
