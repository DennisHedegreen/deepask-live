"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiPath } from "@/lib/paths";

const REACTION_LABELS = {
  agree: "Agree",
  important: "Important",
  concern: "Concern",
  needsDiscussion: "Needs discussion",
  missingPerspective: "Missing perspective"
};

const STORAGE_KEY = "deepask-mind-hive-reactions-v1";
const SURVEY_COMPLETED_PREFIX = "deepask-survey-completed-v1";

function loadLocalReactions(surveyId) {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(`${STORAGE_KEY}:${surveyId}`) || "{}");
  } catch {
    return {};
  }
}

function saveLocalReactions(surveyId, reactions) {
  window.localStorage.setItem(`${STORAGE_KEY}:${surveyId}`, JSON.stringify(reactions));
}

function hasCompletedSurvey(surveyId) {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(`${SURVEY_COMPLETED_PREFIX}:${surveyId}`) === "true";
}

function reactionTotal(reactions) {
  return Object.values(reactions || {}).reduce((total, count) => total + Number(count || 0), 0);
}

function StatementCard({ statement, localReactions, onReact, canReact }) {
  const statementLocal = localReactions[statement.id] || {};
  return (
    <article className="response-card stack">
      <div className="response-head">
        <strong>{statement.title}</strong>
        <span>
          mentioned in {statement.responseCount} submitted survey
          {statement.responseCount === 1 ? "" : "s"}
        </span>
      </div>
      <div className="pill-list">
        <span className="pill">{statement.category}</span>
        <span className="pill">{statement.signalType}</span>
        <span className="pill">
          {reactionTotal(statement.reactions)} participant reaction
          {reactionTotal(statement.reactions) === 1 ? "" : "s"}
        </span>
      </div>
      <p>{statement.summary}</p>
      <p className="note">
        One group pattern at a time. React if this statement deserves attention
        before moving to the next one.
      </p>
      <div className="actions">
        {Object.entries(REACTION_LABELS).map(([type, label]) => {
          const alreadyReacted = Boolean(statementLocal[type]);
          return (
            <button
              className={`button ${alreadyReacted ? "" : "secondary"}`}
              disabled={alreadyReacted || !canReact}
              key={type}
              type="button"
              onClick={() => onReact(statement.id, type)}
            >
              {label}: {statement.reactions[type] || 0}
            </button>
          );
        })}
      </div>
    </article>
  );
}

function CompactStatementList({ title, statements, emptyText }) {
  return (
    <section className="card stack">
      <h2>{title}</h2>
      {statements.length ? (
        <div className="field-list">
          {statements.map((statement) => (
            <div className="field" key={statement.id}>
              <dt>
                {statement.signalType} · mentioned in {statement.responseCount} survey
                {statement.responseCount === 1 ? "" : "s"}
              </dt>
              <dd>
                <strong>{statement.title}</strong>
                <p style={{ marginTop: 6 }}>{statement.summary}</p>
              </dd>
            </div>
          ))}
        </div>
      ) : (
        <p className="note">{emptyText}</p>
      )}
    </section>
  );
}

export default function MindHiveView({ survey }) {
  const surveyId = survey.id;
  const [hive, setHive] = useState(null);
  const [usingDemo, setUsingDemo] = useState(false);
  const [localReactions, setLocalReactions] = useState({});
  const [canReact, setCanReact] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    setLocalReactions(loadLocalReactions(surveyId));
    setCanReact(hasCompletedSurvey(surveyId));
    async function loadHive() {
      try {
        const response = await fetch(apiPath(`/api/mind-hive?survey_id=${encodeURIComponent(surveyId)}`), { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load Mind Hive");
        setHive(data.hive);
        setUsingDemo(Boolean(data.usingDemo));
      } catch (requestError) {
        setError(requestError.message);
      }
    }
    loadHive();
  }, [surveyId]);

  const overview = hive?.overview || {};
  const sortedStatements = useMemo(
    () =>
      [...(hive?.statements || [])].sort(
        (a, b) => b.responseCount + reactionTotal(b.reactions) - (a.responseCount + reactionTotal(a.reactions))
      ),
    [hive]
  );
  const currentStatement = sortedStatements[currentIndex] || null;
  const hasEnoughGroupSignal = Boolean(overview.hasEnoughGroupSignal);
  const minimumResponses = overview.minimumResponsesForGroupSignal || 5;
  const responsesNeeded = Math.max(
    0,
    minimumResponses - Number(overview.totalSurveyResponses || 0)
  );
  const isLastStatement = currentIndex >= sortedStatements.length - 1;

  async function handleReact(statementId, reactionType) {
    const current = loadLocalReactions(surveyId);
    if (current[statementId]?.[reactionType]) return;

    setError("");
    setStatus("Saving collective reaction...");
    try {
      const response = await fetch(apiPath("/api/mind-hive/reactions"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          survey_id: surveyId,
          statement_id: statementId,
          reaction_type: reactionType
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save reaction");

      const nextLocal = {
        ...current,
        [statementId]: {
          ...(current[statementId] || {}),
          [reactionType]: true
        }
      };
      saveLocalReactions(surveyId, nextLocal);
      setLocalReactions(nextLocal);
      setHive(data.hive);
      setStatus("");
    } catch (requestError) {
      setError(requestError.message);
      setStatus("");
    }
  }

  function moveStatement(direction) {
    setCurrentIndex((index) => {
      const next = index + direction;
      return Math.max(0, Math.min(next, sortedStatements.length - 1));
    });
  }

  return (
    <main className="page">
      <div className="shell">
        <header className="topbar">
          <div className="brand">
            <strong>DeepAsk Live</strong>
            <span>Participant group results</span>
          </div>
          <nav className="nav" aria-label="Primary">
            <Link href={`/s/${surveyId}`}>Survey</Link>
            <Link href={`/s/${surveyId}/about`}>About</Link>
          </nav>
        </header>

        <section className="hero">
          <p className="eyebrow">Collective civic intelligence</p>
          <h1>{survey.title} Mind Hive</h1>
          <p className="lede">
            Mind Hive transforms individual survey answers into shared civic
            patterns. It does not show who said what. It shows what the group
            appears to be thinking, where people agree, where they disagree, and
            what questions should be asked next. Survey participants can react to
            collective statements after submitting their own response.
          </p>
        </section>

        {error ? <p className="warning">{error}</p> : null}
        {status ? <p className="note">{status}</p> : null}
        {usingDemo ? (
          <p className="note">No stored responses yet. Showing demo group patterns.</p>
        ) : null}
        {!canReact ? (
          <p className="warning">
            This result page is readable, but reactions are intended for people
            who have completed the survey in this browser. Submit a survey response
            first to react to collective statements.
          </p>
        ) : null}

        <section className="dashboard-grid">
          <div className="card metric">
            <p className="eyebrow">Survey responses</p>
            <strong>{overview.totalSurveyResponses || 0}</strong>
          </div>
          <div className="card metric">
            <p className="eyebrow">Collective statements</p>
            <strong>{overview.totalCollectiveStatements || 0}</strong>
          </div>
          <div className="card metric">
            <p className="eyebrow">Reactions</p>
            <strong>{overview.totalReactions || 0}</strong>
          </div>
          <div className="card metric">
            <p className="eyebrow">Most supported</p>
            <strong style={{ fontSize: "1rem", lineHeight: 1.2 }}>
              {overview.mostSupportedTheme || "Not enough signal yet"}
            </strong>
          </div>
          <div className="card metric">
            <p className="eyebrow">Most debated</p>
            <strong style={{ fontSize: "1rem", lineHeight: 1.2 }}>
              {overview.mostDebatedTheme || "Not enough signal yet"}
            </strong>
          </div>
        </section>

        {!hasEnoughGroupSignal ? (
          <section className="card stack" style={{ marginTop: 18 }}>
            <p className="eyebrow">Group signal not ready yet</p>
            <h2>More answers are needed before Mind Hive opens.</h2>
            <p>
              Mind Hive only becomes a group layer when enough people have answered.
              Right now there {responsesNeeded === 1 ? "is" : "are"} still{" "}
              {responsesNeeded} more response{responsesNeeded === 1 ? "" : "s"} needed
              before collective statements are shown.
            </p>
            <p className="note">
              Your response has still been saved. It will become part of the group
              map when the survey has enough data to avoid over-reading one person's
              answer.
            </p>
            <div className="actions">
              <Link className="button" href={`/s/${surveyId}`}>
                Submit another response
              </Link>
            </div>
          </section>
        ) : (
          <section className="stack" style={{ marginTop: 18 }}>
            <div className="card stack">
              <p className="eyebrow">
                Statement {Math.min(currentIndex + 1, sortedStatements.length)} of{" "}
                {sortedStatements.length}
              </p>
              <h2>Review one group pattern</h2>
              <p className="note">
                These are interpreted group patterns. They are not personal result
                pages and they do not expose raw individual answers.
              </p>
            </div>

            {currentStatement ? (
              <StatementCard
                canReact={canReact}
                localReactions={localReactions}
                onReact={handleReact}
                statement={currentStatement}
              />
            ) : null}

            <div className="actions">
              <button
                className="button secondary"
                type="button"
                disabled={currentIndex === 0}
                onClick={() => moveStatement(-1)}
              >
                Previous
              </button>
              <button
                className="button"
                type="button"
                disabled={isLastStatement}
                onClick={() => moveStatement(1)}
              >
                Next statement
              </button>
            </div>

            {isLastStatement ? (
              <section className="card stack">
                <h2>Suggested next questions</h2>
                <div className="field-list">
                  {(hive?.nextQuestions || []).map((question, index) => (
                    <div className="field" key={question}>
                      <dt>Question {index + 1}</dt>
                      <dd>{question}</dd>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </section>
        )}

        <footer className="footer">
          Mind Hive is a hackathon prototype. It shows interpreted group patterns
          for human review, not final institutional conclusions.
        </footer>
      </div>
    </main>
  );
}
