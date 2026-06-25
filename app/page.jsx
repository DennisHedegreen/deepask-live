import Link from "next/link";
import AIActCard from "@/components/AIActCard";
import { getSurveys } from "@/lib/storage";

export default async function Home() {
  const surveys = await getSurveys();
  const activeSurvey = surveys.find((survey) => survey.status === "active") || surveys[0];

  return (
    <main className="page">
      <div className="shell">
        <header className="topbar">
          <div className="brand">
            <strong>Paradogs</strong>
            <span>Yes, but no</span>
          </div>
          <nav className="nav" aria-label="Primary">
            <Link href={`/s/${activeSurvey.id}`}>Participant survey</Link>
            <Link href="/organizer">Organiser</Link>
          </nav>
        </header>

        <section className="hero">
          <p className="eyebrow">EU Civic Tech Hackathon · Paradogs</p>
          <h1>Yes, but no</h1>
          <p className="lede">
            DeepAsk turns individual civic input into a collective group map without
            exposing individual answers. Participants answer. Organisers design the
            questions. Mind Hive shows what the group appears to be thinking.
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
          <Link className="portal-card" href="/organizer">
            <p className="eyebrow">For organisers</p>
            <h2>Build the survey</h2>
            <p>
              Create questions, set the follow-up limit, and inspect the civic
              signals behind the group map.
            </p>
            <span className="portal-action">Open organiser workspace</span>
          </Link>
        </section>

        <section style={{ marginTop: 18 }}>
          <AIActCard compact />
        </section>
      </div>
    </main>
  );
}
