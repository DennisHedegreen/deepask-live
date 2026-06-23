"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiPath, appPath } from "@/lib/paths";

const ORGANIZER_CODE_KEY = "deepask-organizer-code-v1";

function emptyQuestion(index) {
  return { question_id: `Q${index + 1}`, question: "" };
}

function summaryOf(response) {
  return response.ai_summary_draft || {};
}

function questionsOf(response) {
  return Array.isArray(response.questions) ? response.questions : [];
}

function countBy(items, getter) {
  return items.reduce((counts, item) => {
    const value = getter(item) || "Uncategorised";
    counts[value] = (counts[value] || 0) + 1;
    return counts;
  }, {});
}

function totalFollowups(response) {
  return questionsOf(response).reduce(
    (total, question) => total + Number(question.followup_count || 0),
    0
  );
}

function answeredQuestionCount(response) {
  return questionsOf(response).filter((question) =>
    (question.turns || []).some((turn) => turn.role === "participant")
  ).length;
}

function rankedEntries(counts) {
  return Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

function RankedList({ counts, empty = "No signals yet." }) {
  const entries = rankedEntries(counts);
  if (!entries.length) return <p className="note">{empty}</p>;
  return (
    <ol className="ranked-list">
      {entries.map(([label, count]) => (
        <li className="ranked-item" key={label}>
          <span>{label}</span>
          <strong>{count}</strong>
        </li>
      ))}
    </ol>
  );
}

function MetricCard({ label, value }) {
  return (
    <div className="card metric">
      <p className="eyebrow">{label}</p>
      <strong>{value}</strong>
    </div>
  );
}

function TabButton({ active, children, onClick }) {
  return (
    <button
      className={`tab-button${active ? " active" : ""}`}
      type="button"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function ResponseCard({ response }) {
  const [showRaw, setShowRaw] = useState(false);
  const summary = summaryOf(response);
  return (
    <article className="response-card stack">
      <div className="response-head">
        <strong>{response.response_id}</strong>
        <span>{response.created_at ? new Date(response.created_at).toLocaleString() : ""}</span>
      </div>
      <dl className="field-list">
        <div className="field">
          <dt>Main theme</dt>
          <dd>{summary.main_theme}</dd>
        </div>
        <div className="field">
          <dt>Neutral summary</dt>
          <dd>{summary.neutral_summary}</dd>
        </div>
        <div className="field">
          <dt>Questions covered</dt>
          <dd>{answeredQuestionCount(response)}</dd>
        </div>
        <div className="field">
          <dt>Follow-ups asked</dt>
          <dd>{totalFollowups(response)}</dd>
        </div>
      </dl>
      <button className="button secondary" type="button" onClick={() => setShowRaw(!showRaw)}>
        {showRaw ? "Hide audit record" : "Show audit record"}
      </button>
      {showRaw ? (
        <div className="stack">
          {questionsOf(response).map((question) => (
            <div className="field" key={question.question_id}>
              <dt>{question.question_id}</dt>
              <dd>
                <strong>{question.question}</strong>
                <div className="stack" style={{ marginTop: 10 }}>
                  {(question.turns || []).map((turn, index) => (
                    <p className="raw" key={`${question.question_id}-${index}`}>
                      {turn.role === "ai" ? "AI follow-up" : "Participant"}: {turn.text}
                    </p>
                  ))}
                </div>
              </dd>
            </div>
          ))}
        </div>
      ) : null}
    </article>
  );
}

export default function OrganizerPage() {
  const [surveys, setSurveys] = useState([]);
  const [selectedSurveyId, setSelectedSurveyId] = useState("");
  const [draft, setDraft] = useState(null);
  const [responses, setResponses] = useState([]);
  const [hive, setHive] = useState(null);
  const [activeTab, setActiveTab] = useState("builder");
  const [organizerCode, setOrganizerCode] = useState("");
  const [codeDraft, setCodeDraft] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const selectedSurvey = surveys.find((survey) => survey.id === selectedSurveyId);

  useEffect(() => {
    const savedCode = window.localStorage.getItem(ORGANIZER_CODE_KEY) || "";
    if (savedCode) {
      setOrganizerCode(savedCode);
      setCodeDraft(savedCode);
      setIsUnlocked(true);
    }
  }, []);

  useEffect(() => {
    async function loadSurveys() {
      try {
        const response = await fetch(apiPath("/api/surveys"), { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load surveys");
        setSurveys(data.surveys || []);
        const first = data.surveys?.[0];
        if (first) {
          setSelectedSurveyId(first.id);
          setDraft(first);
        }
      } catch (requestError) {
        setError(requestError.message);
      }
    }
    loadSurveys();
  }, []);

  useEffect(() => {
    if (!selectedSurveyId || !isUnlocked) return;
    async function loadResponses() {
      try {
        const response = await fetch(apiPath(`/api/responses?survey_id=${encodeURIComponent(selectedSurveyId)}`), {
          cache: "no-store",
          headers: organizerHeaders()
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load responses");
        setResponses(data.responses || []);
      } catch (requestError) {
        setError(requestError.message);
      }
    }
    loadResponses();
  }, [selectedSurveyId, isUnlocked, organizerCode]);

  useEffect(() => {
    if (!selectedSurveyId) {
      setHive(null);
      return;
    }
    async function loadHive() {
      try {
        const response = await fetch(
          apiPath(`/api/mind-hive?survey_id=${encodeURIComponent(selectedSurveyId)}`),
          { cache: "no-store" }
        );
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load Mind Hive");
        setHive(data.hive || null);
      } catch (requestError) {
        setError(requestError.message);
      }
    }
    loadHive();
  }, [selectedSurveyId]);

  const themeCounts = useMemo(
    () => countBy(responses, (response) => summaryOf(response).main_theme),
    [responses]
  );
  const barrierCounts = useMemo(
    () => countBy(responses, (response) => summaryOf(response).barrier_or_need),
    [responses]
  );

  function selectSurvey(id) {
    const survey = surveys.find((item) => item.id === id);
    setSelectedSurveyId(id);
    setDraft(survey || null);
    setStatus("");
  }

  function updateDraft(field, value) {
    setDraft((current) => ({ ...(current || {}), [field]: value }));
  }

  function updateQuestion(index, value) {
    setDraft((current) => ({
      ...current,
      questions: (current.questions || []).map((question, questionIndex) =>
        questionIndex === index ? { ...question, question: value } : question
      )
    }));
  }

  function addQuestion() {
    setDraft((current) => {
      const questions = current?.questions || [];
      return { ...current, questions: [...questions, emptyQuestion(questions.length)] };
    });
  }

  function removeQuestion(index) {
    setDraft((current) => ({
      ...current,
      questions: (current.questions || []).filter((_, questionIndex) => questionIndex !== index)
    }));
  }

  function newSurvey() {
    const next = {
      id: "",
      title: "New civic survey",
      subtitle: "EU Civic Tech Survey",
      intro:
        "Answer one question at a time. Your answers help form a shared group map without showing who said what.",
      mode: "simple",
      followup_limit: 3,
      status: "active",
      questions: [emptyQuestion(0)]
    };
    setSelectedSurveyId("");
    setDraft(next);
  }

  async function saveDraft(event) {
    event.preventDefault();
    setError("");
    setStatus("Saving survey...");
    try {
      const url = draft.id && selectedSurveyId
        ? apiPath(`/api/surveys/${draft.id}`)
        : apiPath("/api/surveys");
      const method = draft.id && selectedSurveyId ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...organizerHeaders() },
        body: JSON.stringify({ ...draft, organizer_code: organizerCode })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save survey");
      const nextSurvey = data.survey;
      setSurveys((current) => {
        const exists = current.some((survey) => survey.id === nextSurvey.id);
        return exists
          ? current.map((survey) => (survey.id === nextSurvey.id ? nextSurvey : survey))
          : [...current, nextSurvey];
      });
      setSelectedSurveyId(nextSurvey.id);
      setDraft(nextSurvey);
      setStatus("Survey saved.");
    } catch (requestError) {
      setError(requestError.message);
      setStatus("");
    }
  }

  function organizerHeaders() {
    return organizerCode ? { "x-organizer-code": organizerCode } : {};
  }

  async function unlockOrganizer(event) {
    event.preventDefault();
    const code = codeDraft.trim();
    if (!code) return;
    setError("");
    setStatus("Checking organiser code...");
    try {
      const response = await fetch(apiPath("/api/organizer/auth"), {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-organizer-code": code },
        body: JSON.stringify({ organizer_code: code })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not unlock organiser");
      window.localStorage.setItem(ORGANIZER_CODE_KEY, code);
      setOrganizerCode(code);
      setIsUnlocked(true);
      setStatus("Organiser unlocked.");
    } catch (requestError) {
      setError(requestError.message);
      setStatus("");
    }
  }

  function lockOrganizer() {
    window.localStorage.removeItem(ORGANIZER_CODE_KEY);
    setOrganizerCode("");
    setCodeDraft("");
    setIsUnlocked(false);
    setResponses([]);
    setStatus("Organiser locked.");
  }

  const averageFollowups = responses.length
    ? (
        responses.reduce((total, response) => total + totalFollowups(response), 0) /
        responses.length
      ).toFixed(1)
    : "0.0";

  const participantRoute = selectedSurvey ? `/s/${selectedSurvey.id}` : "";
  const hiveRoute = selectedSurvey ? `/s/${selectedSurvey.id}/mind-hive` : "";
  const participantUrl = participantRoute ? appPath(participantRoute) : "";
  const hiveUrl = hiveRoute ? appPath(hiveRoute) : "";

  return (
    <main className="page">
      <div className="shell">
        <header className="topbar">
          <div className="brand">
            <strong>Paradogs</strong>
            <span>Organiser workspace</span>
          </div>
          <nav className="nav" aria-label="Primary">
            <Link href="/organizer">Organiser</Link>
            <Link href="/organizer/about">About</Link>
            {selectedSurvey ? (
              <Link href={`/s/${selectedSurvey.id}`}>Open participant survey</Link>
            ) : null}
            {isUnlocked ? (
              <button className="nav-button" type="button" onClick={lockOrganizer}>
                Lock
              </button>
            ) : null}
          </nav>
        </header>

        <section className="hero">
          <p className="eyebrow">Paradogs · survey builder</p>
          <h1>Organiser workspace</h1>
          <p className="lede">
            Build the civic question flow, keep participant answers separate, and
            inspect the operational signals behind the Mind Hive group map.
          </p>
        </section>

        {error ? <p className="warning">{error}</p> : null}
        {status ? <p className="success">{status}</p> : null}

        {!isUnlocked ? (
          <section className="grid">
            <form className="card stack" onSubmit={unlockOrganizer}>
              <div>
                <p className="eyebrow">Private organiser area</p>
                <h2>Enter organiser code</h2>
              </div>
              <p className="note">
                Participant surveys stay public. This workspace controls questions,
                raw response audit, and operational settings.
              </p>
              <label>
                <strong>Organiser code</strong>
                <input
                  autoComplete="off"
                  type="password"
                  value={codeDraft}
                  onChange={(event) => setCodeDraft(event.target.value)}
                  placeholder="Enter code"
                />
              </label>
              <div className="actions">
                <button className="button" disabled={!codeDraft.trim() || Boolean(status)}>
                  Unlock organiser
                </button>
              </div>
            </form>
            <aside className="card stack">
              <h2>Boundary</h2>
              <p className="note">
                No user system. Just a shared organiser code for the hackathon demo.
              </p>
              <p className="note">
                Live deployments should set <strong>ORGANIZER_CODE</strong> in the
                server environment.
              </p>
            </aside>
          </section>
        ) : null}

        {isUnlocked ? <section className="workspace-tabs" aria-label="Organiser sections">
          <TabButton active={activeTab === "builder"} onClick={() => setActiveTab("builder")}>
            Builder
          </TabButton>
          <TabButton active={activeTab === "results"} onClick={() => setActiveTab("results")}>
            Results
          </TabButton>
          <TabButton active={activeTab === "mindHive"} onClick={() => setActiveTab("mindHive")}>
            Mind Hive
          </TabButton>
          <TabButton active={activeTab === "audit"} onClick={() => setActiveTab("audit")}>
            Audit
          </TabButton>
          <TabButton active={activeTab === "share"} onClick={() => setActiveTab("share")}>
            Share
          </TabButton>
        </section> : null}

        {isUnlocked && activeTab === "builder" ? (
          <section className="grid">
            <form className="card stack" onSubmit={saveDraft}>
              <div className="section-head">
                <div>
                  <p className="eyebrow">Configure</p>
                  <h2>Survey builder</h2>
                </div>
                <button className="button secondary" type="button" onClick={newSurvey}>
                  New survey
                </button>
              </div>

              <label>
                <strong>Survey</strong>
                <select
                  value={selectedSurveyId}
                  onChange={(event) => selectSurvey(event.target.value)}
                >
                  <option value="">New survey</option>
                  {surveys.map((survey) => (
                    <option key={survey.id} value={survey.id}>
                      {survey.title}
                    </option>
                  ))}
                </select>
              </label>

              {draft ? (
                <>
                  <label>
                    <strong>Survey ID</strong>
                    <input
                      value={draft.id || ""}
                      onChange={(event) => updateDraft("id", event.target.value)}
                      placeholder="citizen-input-2026"
                      disabled={Boolean(selectedSurveyId)}
                    />
                  </label>
                  <label>
                    <strong>Title</strong>
                    <input
                      value={draft.title || ""}
                      onChange={(event) => updateDraft("title", event.target.value)}
                      required
                    />
                  </label>
                  <label>
                    <strong>Public subtitle</strong>
                    <input
                      value={draft.subtitle || ""}
                      onChange={(event) => updateDraft("subtitle", event.target.value)}
                    />
                  </label>
                  <label>
                    <strong>Participant intro</strong>
                    <textarea
                      value={draft.intro || ""}
                      onChange={(event) => updateDraft("intro", event.target.value)}
                      required
                    />
                  </label>
                  <div className="form-row">
                    <label>
                      <strong>Mode</strong>
                      <select
                        value={draft.mode || "simple"}
                        onChange={(event) => updateDraft("mode", event.target.value)}
                      >
                        <option value="simple">Simple survey</option>
                        <option value="advanced">Research mode</option>
                      </select>
                    </label>
                    <label>
                      <strong>Follow-up limit</strong>
                      <input
                        type="number"
                        min="0"
                        max="8"
                        value={draft.followup_limit ?? 3}
                        onChange={(event) =>
                          updateDraft("followup_limit", Number(event.target.value))
                        }
                      />
                    </label>
                  </div>

                  <div className="stack">
                    <h2>Questions</h2>
                    {(draft.questions || []).map((question, index) => (
                      <div className="field" key={`${question.question_id}-${index}`}>
                        <dt>{question.question_id || `Q${index + 1}`}</dt>
                        <dd className="stack">
                          <textarea
                            value={question.question || ""}
                            onChange={(event) => updateQuestion(index, event.target.value)}
                            required
                          />
                          <button
                            className="button secondary"
                            type="button"
                            onClick={() => removeQuestion(index)}
                            disabled={(draft.questions || []).length <= 1}
                          >
                            Remove question
                          </button>
                        </dd>
                      </div>
                    ))}
                    <button className="button secondary" type="button" onClick={addQuestion}>
                      Add question
                    </button>
                  </div>

                  <div className="actions">
                    <button className="button" type="submit">
                      Save survey
                    </button>
                    {draft.id ? (
                      <>
                        <Link className="button secondary" href={`/s/${draft.id}`}>
                          Participant link
                        </Link>
                        <Link className="button secondary" href={`/s/${draft.id}/mind-hive`}>
                          Group result
                        </Link>
                      </>
                    ) : null}
                  </div>
                </>
              ) : null}
            </form>

            <aside className="card stack">
              <h2>Boundary</h2>
              <p className="note">
                Participants stay in a clean survey flow. Organisers configure questions,
                review aggregate patterns, and inspect operational data here.
              </p>
              <p className="note">
                Mind Hive stays collective: it shows group patterns and statement reactions,
                not public pages for individual people.
              </p>
            </aside>
          </section>
        ) : null}

        {isUnlocked && activeTab === "results" ? (
          <section className="stack">
            <div className="dashboard-grid">
              <MetricCard label="Responses" value={responses.length} />
              <MetricCard label="Questions" value={selectedSurvey?.questions?.length || 0} />
              <MetricCard label="Avg. follow-ups" value={averageFollowups} />
              <MetricCard label="Survey status" value={selectedSurvey?.status || "draft"} />
            </div>
            <div className="results-grid">
              <div className="card stack">
                <div className="section-head">
                  <div>
                    <p className="eyebrow">Aggregate</p>
                    <h2>Main themes</h2>
                  </div>
                </div>
                <RankedList counts={themeCounts} />
              </div>
              <div className="card stack">
                <div className="section-head">
                  <div>
                    <p className="eyebrow">Needs</p>
                    <h2>Barriers / needs</h2>
                  </div>
                </div>
                <RankedList counts={barrierCounts} />
              </div>
            </div>
          </section>
        ) : null}

        {isUnlocked && activeTab === "mindHive" ? (
          <section className="stack">
            <div className="dashboard-grid">
              <MetricCard
                label="Collective statements"
                value={hive?.overview?.totalCollectiveStatements || 0}
              />
              <MetricCard label="Participant reactions" value={hive?.overview?.totalReactions || 0} />
              <MetricCard
                label="Minimum signal"
                value={`${responses.length}/${hive?.overview?.minimumResponsesForGroupSignal || 5}`}
              />
              <MetricCard
                label="Signal state"
                value={hive?.overview?.hasEnoughGroupSignal ? "ready" : "early"}
              />
            </div>
            <div className="card stack">
              <div className="section-head">
                <div>
                  <p className="eyebrow">Collective civic intelligence</p>
                  <h2>Mind Hive map</h2>
                </div>
                {hiveRoute ? (
                  <Link className="button secondary" href={hiveRoute}>
                    Open participant review
                  </Link>
                ) : null}
              </div>
              <p className="note">
                These are interpreted group patterns. They use submitted survey answers
                without exposing raw individual responses.
              </p>
              <div className="statement-list">
                {(hive?.statements || []).map((statement) => {
                  const reactionTotal = Object.values(statement.reactions || {}).reduce(
                    (total, count) => total + count,
                    0
                  );
                  return (
                    <article className="statement-row" key={statement.id}>
                      <div>
                        <h3>{statement.title}</h3>
                        <p>{statement.summary}</p>
                        <div className="pill-list">
                          <span className="pill">{statement.category}</span>
                          <span className="pill">{statement.signalType}</span>
                          <span className="pill">{reactionTotal} participant reactions</span>
                        </div>
                      </div>
                      <strong>{statement.responseCount} mentions</strong>
                    </article>
                  );
                })}
              </div>
            </div>
          </section>
        ) : null}

        {isUnlocked && activeTab === "audit" ? (
          <section className="stack">
            <div className="card stack">
              <div className="section-head">
                <div>
                  <p className="eyebrow">Operational review</p>
                  <h2>Response workpacks</h2>
                </div>
                <span className="pill">{responses.length} saved</span>
              </div>
              <p className="note">
                Audit is for organisers only. It is not the participant-facing result page.
              </p>
            </div>
            {responses.length ? (
              responses.map((response) => (
                <ResponseCard key={response.response_id} response={response} />
              ))
            ) : (
              <p className="note">No responses for this survey yet.</p>
            )}
          </section>
        ) : null}

        {isUnlocked && activeTab === "share" ? (
          <section className="grid">
            <div className="card stack">
              <div>
                <p className="eyebrow">Public routes</p>
                <h2>Share links</h2>
              </div>
              <div className="share-list">
                <div className="share-item">
                  <span>Participant survey</span>
                  {participantRoute ? <Link href={participantRoute}>{participantUrl}</Link> : <strong>Save first</strong>}
                </div>
                <div className="share-item">
                  <span>Group result review</span>
                  {hiveRoute ? <Link href={hiveRoute}>{hiveUrl}</Link> : <strong>Save first</strong>}
                </div>
                <div className="share-item">
                  <span>Organiser workspace</span>
                  <Link href="/organizer">/organizer</Link>
                </div>
              </div>
            </div>
            <aside className="card stack">
              <h2>Demo line</h2>
              <p className="note">
                Paradogs: Yes, but no. DeepAsk turns one-at-a-time civic answers into a
                collective group map people can react to after submitting.
              </p>
            </aside>
          </section>
        ) : null}
      </div>
    </main>
  );
}
