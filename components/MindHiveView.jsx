"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
const REACTION_TOKEN_PREFIX = "deepask-reaction-token-v1";

function reactionsStorageKey(surveyId, participantToken) {
  const token = String(participantToken || "").trim();
  return token ? `${STORAGE_KEY}:${surveyId}:${token}` : "";
}

function loadLocalReactions(surveyId, participantToken) {
  if (typeof window === "undefined") return {};
  const storageKey = reactionsStorageKey(surveyId, participantToken);
  if (!storageKey) return {};
  try {
    return JSON.parse(window.localStorage.getItem(storageKey) || "{}");
  } catch {
    return {};
  }
}

function saveLocalReactions(surveyId, participantToken, reactions) {
  const storageKey = reactionsStorageKey(surveyId, participantToken);
  if (!storageKey) return;
  window.localStorage.setItem(storageKey, JSON.stringify(reactions));
}

function hasCompletedSurvey(surveyId) {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(`${SURVEY_COMPLETED_PREFIX}:${surveyId}`) === "true";
}

function loadReactionToken(surveyId) {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(`${REACTION_TOKEN_PREFIX}:${surveyId}`) || "";
}

function canReactInBrowser(surveyId) {
  return hasCompletedSurvey(surveyId) && Boolean(loadReactionToken(surveyId));
}

function reactionTotal(reactions) {
  return Object.values(reactions || {}).reduce((total, count) => total + Number(count || 0), 0);
}

function StatementProgress({ currentIndex, total }) {
  const safeTotal = Math.max(1, total);
  const current = Math.min(currentIndex + 1, safeTotal);
  const percentage = (current / safeTotal) * 100;

  return (
    <div className="statement-progress" aria-label={`Statement ${current} of ${safeTotal}`}>
      <div className="progress-track" aria-hidden="true">
        <span style={{ width: `${percentage}%` }} />
      </div>
      <span>{current} of {safeTotal} reviewed</span>
    </div>
  );
}

function StatementCard({ statement, localReactions, onReact, canReact, usingDemo }) {
  const statementLocal = localReactions[statement.id] || {};
  return (
    <article className="response-card stack">
      <div className="response-head hive-statement-head">
        <strong className="hive-statement-title">{statement.title}</strong>
        <span>
          mentioned in {statement.responseCount} {usingDemo ? "responses in this demo map" : "submitted survey"}
          {!usingDemo && statement.responseCount !== 1 ? "s" : ""}
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
      <p className="hive-statement-summary">{statement.summary}</p>
      <p className="note">
        One group pattern at a time. React if this statement deserves attention
        before moving to the next one.
      </p>
      <div className="actions">
        {Object.entries(REACTION_LABELS).map(([type, label]) => {
          const alreadyReacted = Boolean(statementLocal[type]);
          return (
            <button
              aria-pressed={alreadyReacted}
              className={`button ${alreadyReacted ? "selected" : "secondary"}`}
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
  const router = useRouter();
  const [hive, setHive] = useState(null);
  const [usingDemo, setUsingDemo] = useState(false);
  const [localReactions, setLocalReactions] = useState({});
  const [canReact, setCanReact] = useState(false);
  const [completionChecked, setCompletionChecked] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    const completed = hasCompletedSurvey(surveyId);
    setHasCompleted(completed);
    setCompletionChecked(true);
    if (!completed) {
      router.replace(`/s/${surveyId}`);
      return;
    }

    const participantToken = loadReactionToken(surveyId);
    setLocalReactions(loadLocalReactions(surveyId, participantToken));
    setCanReact(canReactInBrowser(surveyId));
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
  }, [router, surveyId]);

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
    const participantToken = loadReactionToken(surveyId);
    const current = loadLocalReactions(surveyId, participantToken);
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
          reaction_type: reactionType,
          participant_token: participantToken
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
      saveLocalReactions(surveyId, participantToken, nextLocal);
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

  if (!completionChecked || !hasCompleted) {
    return (
      <main className="page">
        <div className="shell">
          <section className="card stack">
            <p className="eyebrow">Participant flow</p>
            <h1>Complete the survey first</h1>
            <p>Mind Hive opens after you submit and approve your survey summary.</p>
            <div className="actions">
              <Link className="button" href={`/s/${surveyId}`}>Take the survey</Link>
              <Link className="button secondary" href="/help">Help</Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="shell">
        <header className="topbar">
          <div className="brand">
            <strong>DeepAsk</strong>
            <span>Participant group results</span>
          </div>
          <nav className="nav" aria-label="Primary">
            <Link href={`/s/${surveyId}`}>Survey</Link>
            <Link href="/help">Help</Link>
          </nav>
        </header>

        <section className="hero">
          <p className="eyebrow">{survey.title}</p>
          <h1>Mind Hive</h1>
          <p className="lede">
            Mind Hive turns individual answers into shared patterns without showing
            who said what. It highlights agreements, tensions, missing perspectives,
            and questions that may deserve another round of inquiry.
          </p>
        </section>

        {error ? <p className="warning">{error}</p> : null}
        {status ? <p className="note">{status}</p> : null}
        {usingDemo ? (
          <p className="warning">
            Demo dataset: {overview.syntheticResponseCount || 0} fictional examples
            {overview.submittedResponseCount
              ? ` plus ${overview.submittedResponseCount} answer${overview.submittedResponseCount === 1 ? "" : "s"} submitted during this demo`
              : " and no submitted demo answers yet"}.
          </p>
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
            <p className="eyebrow">Responses in map</p>
            <strong>{overview.totalSurveyResponses || 0}</strong>
            {usingDemo ? (
              <span className="note">
                {overview.syntheticResponseCount || 0} synthetic · {overview.submittedResponseCount || 0} submitted
              </span>
            ) : null}
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
              <StatementProgress
                currentIndex={currentIndex}
                total={sortedStatements.length}
              />
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
                usingDemo={usingDemo}
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
          Mind Hive shows interpreted group patterns for human review, not final
          institutional conclusions. Synthetic examples are labelled separately
          from answers submitted during this demo.
        </footer>
      </div>
    </main>
  );
}
