import Link from "next/link";
import { getSurveys } from "@/lib/storage";

export const dynamic = "force-dynamic";

export default async function HelpPage() {
  const surveys = await getSurveys();
  const survey = surveys.find((item) => item.status === "active") || surveys[0];

  return (
    <main className="page">
      <div className="shell">
        <header className="topbar">
          <div className="brand">
            <strong>DeepAsk</strong>
            <span>Demo help</span>
          </div>
          <nav className="nav" aria-label="Primary">
            <Link href={`/s/${survey.id}`}>Survey</Link>
            <Link href={`/s/${survey.id}/mind-hive`}>Mind Hive</Link>
            <Link href="/">Home</Link>
          </nav>
        </header>

        <section className="hero compact-hero">
          <p className="eyebrow">Help</p>
          <h1>How this demo works</h1>
          <p className="lede">
            DeepAsk is testing a simple idea: open answers can stay in the
            participant&apos;s own words while AI helps clarify meaning and reveal
            group patterns for human review.
          </p>
        </section>

        <section className="grid">
          <div className="card stack">
            <h2>Four short steps</h2>
            <ol className="help-steps">
              <li><strong>Answer</strong> one of the public-data questions.</li>
              <li><strong>Clarify</strong> your answer with one neutral follow-up.</li>
              <li><strong>Review</strong> the AI-drafted summary and edit it if needed.</li>
              <li><strong>Explore</strong> collective patterns in Mind Hive.</li>
            </ol>
          </div>

          <div className="card stack">
            <h2>What is synthetic?</h2>
            <p>
              Mind Hive begins with six fictional example responses so the group
              view is understandable before several people have used the demo.
            </p>
            <p className="note">
              Synthetic examples are labelled separately from answers submitted
              during the demo. They do not represent any real participant.
            </p>
          </div>

          <div className="card stack">
            <h2>What is stored?</h2>
            <p>
              The demo stores your original answer, the follow-up exchange, the
              AI draft, and the version you approve. Raw individual answers are
              kept out of the public Mind Hive view.
            </p>
            <p className="warning">
              Do not enter names, contact details, health information, or other
              sensitive personal information.
            </p>
          </div>

          <div className="card stack">
            <h2>What does the AI do?</h2>
            <p>
              AI asks a neutral follow-up and drafts a summary. It does not decide
              what is correct, rank people, or make a public-policy decision.
            </p>
            <p className="note">
              If no external AI provider is configured, the demo uses a simple
              deterministic fallback so the flow remains testable.
            </p>
          </div>
        </section>

        <div className="actions" style={{ marginTop: 18 }}>
          <Link className="button" href={`/s/${survey.id}`}>Start the survey</Link>
          <Link className="button secondary" href={`/s/${survey.id}/mind-hive`}>
            View Mind Hive
          </Link>
        </div>
      </div>
    </main>
  );
}
