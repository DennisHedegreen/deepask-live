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
          <nav className="nav" aria-label="Primary">
            <Link href={`/s/${activeSurvey.id}`}>Survey</Link>
            <Link href={`/s/${activeSurvey.id}/mind-hive`}>Mind Hive</Link>
            <Link href="/help">Help</Link>
          </nav>
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
        </section>

        <section className="portal-grid">
          <Link className="portal-card" href={`/s/${activeSurvey.id}`}>
            <p className="eyebrow">For participants</p>
            <h2>Take the survey</h2>
            <p>
              Answer in your own words, confirm your summary, and review the
              Mind Hive group answers one at a time.
            </p>
            <span className="portal-action">Start participant flow</span>
          </Link>
          <Link className="portal-card" href={`/s/${activeSurvey.id}/mind-hive`}>
            <p className="eyebrow">Collective view</p>
            <h2>Explore Mind Hive</h2>
            <p>
              See clearly labelled synthetic examples alongside any answers
              submitted during this demo.
            </p>
            <span className="portal-action">View group patterns</span>
          </Link>
        </section>

        <section className="card stack" style={{ marginTop: 18 }}>
          <p className="eyebrow">Before you begin</p>
          <h2>Need a quick explanation?</h2>
          <p>
            The Help page explains the four-step flow, what is stored, and which
            Mind Hive answers are synthetic examples.
          </p>
          <div className="actions">
            <Link className="button secondary" href="/help">Open Help</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
