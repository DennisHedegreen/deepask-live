import Link from "next/link";

export default function OrganizerAboutPage() {
  return (
    <main className="page">
      <div className="shell">
        <header className="topbar">
          <div className="brand">
            <strong>Paradogs</strong>
            <span>Organiser explanation</span>
          </div>
          <nav className="nav" aria-label="Primary">
            <Link href="/organizer">Organiser workspace</Link>
          </nav>
        </header>

        <section className="hero">
          <p className="eyebrow">EU civic infrastructure concept</p>
          <h1>About the organiser side</h1>
          <p className="lede">
            The organiser side is for setting up civic questions, monitoring
            participation, and reading collective signals without exposing raw
            personal answers as public content.
          </p>
          <div className="pill-list" style={{ marginTop: 22 }}>
            <span className="pill">Yes, but no</span>
            <span className="pill">Civic input</span>
            <span className="pill">Collective intelligence</span>
          </div>
        </section>

        <section className="grid">
          <div className="card stack">
            <h2>Purpose</h2>
            <p>
              DeepAsk is built around a simple democratic question: how can a group
              be made readable without reducing citizens to checkboxes or turning
              individual answers into social-media objects?
            </p>
            <p>
              Organisers create the survey and define the questions. Participants
              respond in a separate interface. The result page then translates many
              responses into a collective civic map.
            </p>
          </div>

          <div className="card stack">
            <h2>Governance boundary</h2>
            <p>
              The dashboard may inspect workpacks for demo, audit, and operational
              review. The participant-facing result should remain aggregated:
              themes, agreements, disagreements, minority concerns, next questions,
              and reactions on collective statements.
            </p>
            <p className="note">
              The product answers: what is the group thinking? It should not become
              a public archive of what one named person answered.
            </p>
          </div>
        </section>

        <section className="card stack" style={{ marginTop: 18 }}>
          <h2>EU civic framing</h2>
          <p>
            In an EU civic-tech context, the important properties are transparency,
            proportionality, inclusion, human oversight, and democratic usability.
            DeepAsk should make it clear when a pattern is interpreted, when the
            signal is weak, and when a minority concern deserves attention even if
            it is not the majority view.
          </p>
          <p>
            AI can help organise participation, but it must remain an assistant to
            human judgement. The organiser remains responsible for framing questions,
            reviewing outputs, and deciding what deserves follow-up.
          </p>
          <div className="actions">
            <Link className="button" href="/organizer">
              Open organiser workspace
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
