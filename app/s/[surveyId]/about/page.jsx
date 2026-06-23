import Link from "next/link";
import { notFound } from "next/navigation";
import { getSurvey } from "@/lib/storage";

export default async function ParticipantAboutPage({ params }) {
  const { surveyId } = await params;
  const survey = await getSurvey(surveyId);

  if (!survey) {
    notFound();
  }

  return (
    <main className="page">
      <div className="shell">
        <header className="topbar">
          <div className="brand">
            <strong>Paradogs</strong>
            <span>Participant explanation</span>
          </div>
          <nav className="nav" aria-label="Primary">
            <Link href={`/s/${survey.id}`}>Survey</Link>
            <Link href={`/s/${survey.id}/mind-hive`}>Group results</Link>
          </nav>
        </header>

        <section className="hero">
          <p className="eyebrow">EU civic participation layer</p>
          <h1>About this survey</h1>
          <p className="lede">
            DeepAsk is a civic-tech prototype for collecting public input without
            turning people into public profiles. You answer in your own words.
            The system asks neutral follow-up questions and helps transform many
            answers into a shared group map.
          </p>
        </section>

        <section className="grid">
          <div className="card stack">
            <h2>What you are doing</h2>
            <p>
              This survey is designed to make participation lighter and more
              meaningful. Instead of forcing every citizen into fixed multiple-choice
              boxes, it lets people explain what they mean in plain language.
            </p>
            <p>
              Your answer may be summarised into civic themes such as needs,
              barriers, agreements, disagreements, minority concerns, or next
              questions. The goal is to help organisers understand what the group
              appears to be thinking.
            </p>
            <p className="note">
              The public result is collective. It does not show who said what.
            </p>
          </div>

          <div className="card stack">
            <h2>How AI is used</h2>
            <p>
              AI is used as an assistant for asking neutral follow-up questions
              and drafting summaries. It is not used to decide what is correct,
              rank participants, or judge individual people.
            </p>
            <p>
              The summary shown to you before submission is a draft civic signal.
              You can confirm it or edit it before your response is saved.
            </p>
            <p className="warning">
              Do not include sensitive personal information, private identifiers,
              health details, or anything you would not want processed as survey
              input.
            </p>
          </div>
        </section>

        <section className="card stack" style={{ marginTop: 18 }}>
          <h2>What happens after submission</h2>
          <p>
            After you submit, the survey continues into Mind Hive. You move through
            the collective group answers one at a time: recurring themes, shared
            agreements, tensions, minority concerns, and suggested next questions.
          </p>
          <p>
            Your reactions are meant to strengthen or qualify the group map, not
            to like or rate another person's answer.
          </p>
          <div className="actions">
            <Link className="button" href={`/s/${survey.id}`}>
              Start survey
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
