"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DEFAULT_SURVEY, SAFEGUARDS } from "@/lib/constants";
import { apiPath } from "@/lib/paths";

const SURVEY_COMPLETED_PREFIX = "deepask-survey-completed-v1";
const HIVE_REACTIONS_PREFIX = "deepask-mind-hive-reactions-v1";

const REACTION_LABELS = {
  agree: "Agree",
  important: "Important",
  concern: "Concern",
  needsDiscussion: "Needs discussion",
  missingPerspective: "Missing perspective"
};

const stepLabels = [
  "Questionnaire",
  "Adaptive follow-ups",
  "Citizen-confirmed summary",
  "Mind Hive review"
];

function createInitialQuestions(survey) {
  return (survey.questions || []).map((question, index) => ({
    question_id: question.question_id || `Q${index + 1}`,
    ...question,
    status: "open",
    followup_count: 0,
    turns: []
  }));
}

function participantTurns(question) {
  return (question.turns || []).filter((turn) => turn.role === "participant");
}

function latestAiTurn(question) {
  return [...(question.turns || [])].reverse().find((turn) => turn.role === "ai");
}

function latestParticipantTurn(question) {
  return [...(question.turns || [])]
    .reverse()
    .find((turn) => turn.role === "participant");
}

function answeredQuestions(questions) {
  return questions.filter((question) => participantTurns(question).length > 0);
}

function hasAnsweredRequiredFollowup(question) {
  return (question.turns || []).some(
    (turn) => turn.role === "participant" && turn.type === "followup_answer"
  );
}

function turnLabel(turn) {
  if (turn.role === "ai") return "AI follow-up";
  if (turn.type === "followup_answer") return "Participant follow-up answer";
  return "Participant feedback";
}

function promptSourceLabel(hasAiTurn) {
  return hasAiTurn ? "AI follow-up question" : "Organiser question";
}

function responseTargetLabel(hasAiTurn) {
  return hasAiTurn ? "Your follow-up answer" : "Your feedback";
}

function reactionTotal(reactions) {
  return Object.values(reactions || {}).reduce(
    (total, count) => total + Number(count || 0),
    0
  );
}

function loadLocalHiveReactions(surveyId) {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(
      window.localStorage.getItem(`${HIVE_REACTIONS_PREFIX}:${surveyId}`) || "{}"
    );
  } catch {
    return {};
  }
}

function saveLocalHiveReactions(surveyId, reactions) {
  window.localStorage.setItem(
    `${HIVE_REACTIONS_PREFIX}:${surveyId}`,
    JSON.stringify(reactions)
  );
}

function StepIndicator({ activeStep, questionIndex, questions }) {
  return (
    <aside className="card">
      <h3>Flow</h3>
      <div className="steps">
        {stepLabels.map((label, index) => (
          <div className={`step ${index === activeStep ? "active" : ""}`} key={label}>
            {index + 1}. {label}
          </div>
        ))}
      </div>
      <p className="note" style={{ marginTop: 12 }}>
        Question {Math.min(questionIndex + 1, questions.length)} of {questions.length}
      </p>
    </aside>
  );
}

function SafeguardCard() {
  return (
    <aside className="card">
      <h3>Safeguards</h3>
      <div className="stack">
        {SAFEGUARDS.map((item) => (
          <p className="note" key={item}>
            {item}
          </p>
        ))}
      </div>
    </aside>
  );
}

function SummaryFields({ summary }) {
  return (
    <dl className="field-list">
      <div className="field">
        <dt>Main theme</dt>
        <dd>{summary.main_theme}</dd>
      </div>
      <div className="field">
        <dt>Barrier or need</dt>
        <dd>{summary.barrier_or_need}</dd>
      </div>
      <div className="field">
        <dt>Suggested improvement</dt>
        <dd>{summary.suggested_improvement}</dd>
      </div>
      <div className="field">
        <dt>Neutral summary</dt>
        <dd>{summary.neutral_summary}</dd>
      </div>
      <div className="field">
        <dt>Sensitive data flag</dt>
        <dd>{summary.sensitive_data_flag ? "true" : "false"}</dd>
      </div>
    </dl>
  );
}

function ConversationPreview({ questions }) {
  return (
    <section className="card stack">
      <h3>Current interview record</h3>
      {questions.map((question) => (
        <div className="field" key={question.question_id}>
          <dt>
            {question.question_id} · {participantTurns(question).length} answer
            {participantTurns(question).length === 1 ? "" : "s"} ·{" "}
            {question.followup_count} follow-up
            {question.followup_count === 1 ? "" : "s"}
          </dt>
          <dd>{question.question}</dd>
          {(question.turns || []).length ? (
            <div className="turn-list">
              {(question.turns || []).map((turn, index) => (
                <div className="turn-item" key={`${question.question_id}-turn-${index}`}>
                  <span className={`role-chip ${turn.role === "ai" ? "ai" : "participant"}`}>
                    {turnLabel(turn)}
                  </span>
                  <p>{turn.text}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ))}
    </section>
  );
}

function InlineHiveStatement({ statement, localReactions, onReact }) {
  const statementLocal = localReactions[statement.id] || {};

  return (
    <article className="response-card hive-review-card stack">
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
        React to this collective statement. You are not reacting to another
        person's answer.
      </p>
      <div className="actions">
        {Object.entries(REACTION_LABELS).map(([type, label]) => {
          const alreadyReacted = Boolean(statementLocal[type]);
          return (
            <button
              className={`button ${alreadyReacted ? "" : "secondary"}`}
              disabled={alreadyReacted}
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

export default function SurveyRunner({ survey: surveyInput }) {
  const survey = surveyInput || DEFAULT_SURVEY;
  const surveyId = survey.id;
  const surveyCompletedKey = `${SURVEY_COMPLETED_PREFIX}:${surveyId}`;
  const [questions, setQuestions] = useState(() => createInitialQuestions(survey));
  const [surveyMode, setSurveyMode] = useState(survey.mode || "simple");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [phase, setPhase] = useState("answer");
  const [answerDraft, setAnswerDraft] = useState("");
  const [summary, setSummary] = useState(null);
  const [editedSummary, setEditedSummary] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [savedWorkpack, setSavedWorkpack] = useState(null);
  const [hive, setHive] = useState(null);
  const [hiveIndex, setHiveIndex] = useState(0);
  const [localHiveReactions, setLocalHiveReactions] = useState({});
  const [autoFollowupAttempts, setAutoFollowupAttempts] = useState({});
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const currentQuestion = questions[questionIndex] || questions[0];
  const currentAiTurn = latestAiTurn(currentQuestion);
  const answered = answeredQuestions(questions);
  const effectiveFollowupLimit = Math.max(1, Number(survey.followup_limit || 3));
  const requiredFollowupAnswered = hasAnsweredRequiredFollowup(currentQuestion);
  const allAnsweredQuestionsReady = answered.every(hasAnsweredRequiredFollowup);
  const canAskFollowup =
    phase === "decision" &&
    currentQuestion.followup_count < effectiveFollowupLimit;
  const canMoveNext = questionIndex < questions.length - 1;
  const sortedHiveStatements = useMemo(
    () =>
      [...(hive?.statements || [])].sort(
        (a, b) =>
          b.responseCount +
          reactionTotal(b.reactions) -
          (a.responseCount + reactionTotal(a.reactions))
      ),
    [hive]
  );
  const currentHiveStatement = sortedHiveStatements[hiveIndex] || null;
  const hiveOverview = hive?.overview || {};
  const hiveReady = Boolean(hiveOverview.hasEnoughGroupSignal);
  const hiveMinimum = Number(hiveOverview.minimumResponsesForGroupSignal || 5);
  const hiveResponses = Number(hiveOverview.totalSurveyResponses || 0);
  const hiveResponsesNeeded = Math.max(0, hiveMinimum - hiveResponses);

  const activeStep = useMemo(() => {
    if (savedWorkpack) return 3;
    if (summary) return 2;
    if (currentQuestion?.followup_count > 0) return 1;
    return 0;
  }, [currentQuestion?.followup_count, savedWorkpack, summary]);

  useEffect(() => {
    if (phase !== "decision") return;
    if (summary || savedWorkpack || status) return;
    if (currentQuestion.followup_count > 0) return;
    const attemptKey = `${questionIndex}:${currentQuestion.question_id}`;
    if (autoFollowupAttempts[attemptKey]) return;
    const hasInitialAnswer = (currentQuestion.turns || []).some(
      (turn) => turn.role === "participant" && turn.type === "initial_answer"
    );
    if (hasInitialAnswer) {
      setAutoFollowupAttempts((current) => ({ ...current, [attemptKey]: true }));
      askFollowup();
    }
  }, [phase, currentQuestion, questionIndex, summary, savedWorkpack, status, autoFollowupAttempts]);

  async function postJson(url, payload) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Request failed");
    return data;
  }

  function updateCurrentQuestion(updater) {
    setQuestions((current) =>
      current.map((question, index) =>
        index === questionIndex ? updater(question) : question
      )
    );
  }

  function appendTurn(question, turn) {
    return {
      ...question,
      turns: [
        ...(question.turns || []),
        {
          ...turn,
          created_at: new Date().toISOString()
        }
      ]
    };
  }

  function handleAnswerSubmit(event) {
    event.preventDefault();
    const text = answerDraft.trim();
    if (!text) return;
    updateCurrentQuestion((question) =>
      appendTurn(question, {
        role: "participant",
        type: currentAiTurn ? "followup_answer" : "initial_answer",
        text
      })
    );
    setAnswerDraft("");
    setPhase("decision");
  }

  async function askFollowup() {
    setError("");
    setStatus("Generating one neutral follow-up question...");
    const latestAnswer = latestParticipantTurn(currentQuestion)?.text || "";
    try {
      const data = await postJson(apiPath("/api/followup"), {
        question: currentQuestion.question,
        turns: currentQuestion.turns,
        latest_answer: latestAnswer,
        followup_count: currentQuestion.followup_count,
        followup_limit: effectiveFollowupLimit
      });
      updateCurrentQuestion((question) =>
        appendTurn(
          {
            ...question,
            followup_count: question.followup_count + 1
          },
          {
            role: "ai",
            type: "followup",
            text: data.follow_up_question,
            theme: data.theme
          }
        )
      );
      setPhase("answer");
      setStatus("");
    } catch (requestError) {
      setError(requestError.message);
      setStatus("");
    }
  }

  function moveToNextQuestion() {
    if (!requiredFollowupAnswered) return;
    updateCurrentQuestion((question) => ({ ...question, status: "completed" }));
    setQuestionIndex((index) => Math.min(index + 1, questions.length - 1));
    setAnswerDraft("");
    setPhase("answer");
  }

  async function generateFinalSummary() {
    if (!allAnsweredQuestionsReady) {
      setError("Please answer the required follow-up before finishing.");
      return;
    }
    setError("");
    setStatus("Generating a final civic summary across all answered questions...");
    try {
      const finalQuestions = questions.map((question, index) =>
        index === questionIndex ? { ...question, status: "completed" } : question
      );
      const data = await postJson(apiPath("/api/summary"), {
        questions: answeredQuestions(finalQuestions)
      });
      setQuestions(finalQuestions);
      setSummary(data);
      setEditedSummary(data.neutral_summary);
      setPhase("summary");
      setStatus("");
    } catch (requestError) {
      setError(requestError.message);
      setStatus("");
    }
  }

  async function saveFinalResponse(confirmed, finalText = null) {
    setError("");
    setStatus("Saving response workpack...");
    try {
      const payload = {
        survey_id: surveyId,
        questionnaire: survey.questions,
        questions: answered,
        ai_summary_draft: summary,
        citizen_confirmed_summary: confirmed,
        citizen_edited_summary: confirmed ? null : finalText,
        final_summary: confirmed ? summary.neutral_summary : finalText
      };
      const data = await postJson(apiPath("/api/responses"), payload);
      window.localStorage.setItem(surveyCompletedKey, "true");
      setSavedWorkpack(data.workpack);
      setPhase("saved");
      await loadHiveReview();
      setStatus("");
    } catch (requestError) {
      setError(requestError.message);
      setStatus("");
    }
  }

  function resetFlow() {
    setQuestions(createInitialQuestions(survey));
    setQuestionIndex(0);
    setPhase("answer");
    setAnswerDraft("");
    setSummary(null);
    setEditedSummary("");
    setIsEditing(false);
    setSavedWorkpack(null);
    setHive(null);
    setHiveIndex(0);
    setLocalHiveReactions({});
    setAutoFollowupAttempts({});
    setStatus("");
    setError("");
  }

  async function loadHiveReview() {
    setStatus("Loading group statements...");
    const response = await fetch(
      apiPath(`/api/mind-hive?survey_id=${encodeURIComponent(surveyId)}`),
      { cache: "no-store" }
    );
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not load group review");
    setHive(data.hive);
    setHiveIndex(0);
    setLocalHiveReactions(loadLocalHiveReactions(surveyId));
    setPhase("groupReview");
    setStatus("");
  }

  async function reactToHiveStatement(statementId, reactionType) {
    const current = loadLocalHiveReactions(surveyId);
    if (current[statementId]?.[reactionType]) return;

    setError("");
    setStatus("Saving reaction...");
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
      saveLocalHiveReactions(surveyId, nextLocal);
      setLocalHiveReactions(nextLocal);
      setHive(data.hive);
      setStatus("");
    } catch (requestError) {
      setError(requestError.message);
      setStatus("");
    }
  }

  const promptText =
    phase === "answer" && currentAiTurn
      ? currentAiTurn.text
      : currentQuestion.question;
  const isSimpleMode = surveyMode === "simple";
  const isHiveReview = phase === "groupReview";
  const gridClassName = isSimpleMode ? "survey-simple-grid" : "grid";
  const answerButtonText = currentAiTurn ? "Send answer" : "Continue";
  const questionLabel = currentAiTurn ? "AI follow-up" : `Question ${questionIndex + 1}`;

  return (
    <main className="page">
      <div className="shell">
        <header className="topbar">
          <div className="brand">
            <strong>Paradogs</strong>
            <span>DeepAsk Live</span>
          </div>
          <nav className="nav" aria-label="Primary">
            <Link href={`/s/${surveyId}`}>Survey</Link>
            <Link href={`/s/${surveyId}/about`}>About</Link>
          </nav>
        </header>

        <section className={`hero ${isHiveReview ? "compact-hero" : ""}`}>
          <p className="eyebrow">{survey.subtitle}</p>
          <h1>{isHiveReview ? "Mind Hive review" : survey.title}</h1>
          <p className="lede">
            {isHiveReview
              ? "Move through the group answers one at a time. React to the collective statements that deserve attention."
              : isSimpleMode
              ? survey.intro
              : "Answer in your own words. DeepAsk can ask neutral follow-up questions, move across several civic questions, and then create a summary you can confirm or edit."}
          </p>
          {!isHiveReview ? <div className="pill-list" style={{ marginTop: 18 }}>
            <span className="pill">{survey.questions?.length || 0} questions</span>
            <span className="pill">Neutral follow-ups</span>
            <span className="pill">Mind Hive after submit</span>
          </div> : null}
          {!isHiveReview ? <div className="actions" style={{ marginTop: 22 }}>
            <button
              className={`button ${isSimpleMode ? "" : "secondary"}`}
              type="button"
              onClick={() => setSurveyMode("simple")}
            >
              Simple survey
            </button>
            <button
              className={`button ${isSimpleMode ? "secondary" : ""}`}
              type="button"
              onClick={() => setSurveyMode("advanced")}
            >
              Research mode
            </button>
          </div> : null}
        </section>

        <section className={gridClassName}>
          <div className="stack">
            {error ? <p className="warning">{error}</p> : null}
            {status ? <p className="note">{status}</p> : null}

            {!summary && !savedWorkpack && phase === "answer" ? (
              <form className="card stack" onSubmit={handleAnswerSubmit}>
                <p className="eyebrow">
                  {isSimpleMode
                    ? questionLabel
                    : `${currentQuestion.question_id}${currentAiTurn ? " · Follow-up question" : " · Main question"}`}
                </p>
                <div className="role-strip" aria-label="Prompt and response source">
                  <span className={`role-chip ${currentAiTurn ? "ai" : "organiser"}`}>
                    Showing: {promptSourceLabel(Boolean(currentAiTurn))}
                  </span>
                  <span className="role-chip participant">
                    Writing: {responseTargetLabel(Boolean(currentAiTurn))}
                  </span>
                </div>
                <p className="question">{promptText}</p>
                <label htmlFor="participant-answer">
                  <strong>{responseTargetLabel(Boolean(currentAiTurn))}</strong>
                </label>
                <textarea
                  id="participant-answer"
                  aria-label="Participant answer"
                  value={answerDraft}
                  onChange={(event) => setAnswerDraft(event.target.value)}
                  placeholder="Write your answer here..."
                  required
                />
                <p className="warning">
                  {isSimpleMode
                    ? "Do not include private personal details."
                    : "Please do not include sensitive personal information."}
                </p>
                {!isSimpleMode ? (
                  <p className="note">
                    AI is used only to ask neutral follow-up questions and summarise
                    themes. It does not persuade, judge, or decide.
                  </p>
                ) : null}
                <div className="actions">
                  <button className="button" disabled={!answerDraft.trim() || Boolean(status)}>
                    {answerButtonText}
                  </button>
                </div>
              </form>
            ) : null}

            {!summary && !savedWorkpack && phase === "decision" ? (
              <section className="card stack">
                <p className="eyebrow">
                  {isSimpleMode ? "Next" : `${currentQuestion.question_id} · Next action`}
                </p>
                <h2>{isSimpleMode ? "Want to add more, or move on?" : "What should happen next?"}</h2>
                <p className="note">
                  {isSimpleMode
                    ? requiredFollowupAnswered
                      ? "You can answer one more follow-up, go to the next question, or finish now."
                      : "DeepAsk is generating a required follow-up before you move on."
                    : requiredFollowupAnswered
                    ? "You can ask another neutral follow-up, move to the next question, or finish now and generate the final civic summary."
                    : "DeepAsk always asks one neutral follow-up before the next main question."}
                </p>
                <div className="actions">
                  <button
                      className="button"
                      type="button"
                      disabled={!canAskFollowup || Boolean(status)}
                      onClick={askFollowup}
                    >
                    {requiredFollowupAnswered
                      ? isSimpleMode
                        ? "Ask me one more"
                        : "Ask another follow-up"
                      : "Retry follow-up"}
                  </button>
                  {canMoveNext ? (
                    <button
                      className="button secondary"
                      type="button"
                      disabled={!requiredFollowupAnswered || Boolean(status)}
                      onClick={moveToNextQuestion}
                    >
                      {isSimpleMode ? "Next" : "Next question"}
                    </button>
                  ) : null}
                  <button
                    className="button secondary"
                    type="button"
                    disabled={!answered.length || !allAnsweredQuestionsReady || Boolean(status)}
                    onClick={generateFinalSummary}
                  >
                    {isSimpleMode ? "Finish" : "Finish and generate summary"}
                  </button>
                </div>
                {!requiredFollowupAnswered ? (
                  <p className="note">
                    The next question unlocks after this follow-up is answered.
                  </p>
                ) : null}
                {requiredFollowupAnswered && !canAskFollowup ? (
                  <p className="note">
                    Follow-up limit reached for this question. Move to the next
                    question or finish.
                  </p>
                ) : null}
              </section>
            ) : null}

            {!savedWorkpack && phase === "summary" && summary ? (
             <section className="card stack">
                <p className="eyebrow">Citizen-confirmed summary</p>
                <h2>{isSimpleMode ? "Is this right?" : "Does this summary reflect what you meant?"}</h2>
                {isSimpleMode ? (
                  <div className="field">
                    <dt>Your summary</dt>
                    <dd>{summary.neutral_summary}</dd>
                  </div>
                ) : (
                  <SummaryFields summary={summary} />
                )}

                {!isSimpleMode && summary.question_summaries?.length ? (
                  <div className="field-list">
                    {summary.question_summaries.map((item) => (
                      <div className="field" key={item.question_id}>
                        <dt>{item.question_id} · {item.theme}</dt>
                        <dd>{item.summary}</dd>
                      </div>
                    ))}
                  </div>
                ) : null}

                {isEditing ? (
                  <div className="stack">
                    <label htmlFor="edited-summary">
                      <strong>{isSimpleMode ? "Edit it" : "Edit summary"}</strong>
                    </label>
                    <textarea
                      id="edited-summary"
                      value={editedSummary}
                      onChange={(event) => setEditedSummary(event.target.value)}
                    />
                    <div className="actions">
                      <button
                        className="button"
                        type="button"
                        disabled={!editedSummary.trim() || Boolean(status)}
                        onClick={() => saveFinalResponse(false, editedSummary)}
                      >
                        {isSimpleMode ? "Submit" : "Submit final response"}
                      </button>
                      <button
                        className="button secondary"
                        type="button"
                        onClick={() => setIsEditing(false)}
                      >
                        {isSimpleMode ? "Cancel" : "Cancel edit"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="actions">
                    <button
                      className="button"
                      type="button"
                      disabled={Boolean(status)}
                      onClick={() => saveFinalResponse(true)}
                    >
                      {isSimpleMode ? "Looks right" : "Yes, submit"}
                    </button>
                    <button
                      className="button secondary"
                      type="button"
                      onClick={() => setIsEditing(true)}
                    >
                      {isSimpleMode ? "Edit" : "Edit summary"}
                    </button>
                  </div>
                )}
              </section>
            ) : null}

            {savedWorkpack && phase === "saved" ? (
              <section className="card stack">
                <p className="success">
                  {isSimpleMode
                    ? "Done. Your answer is part of the group map."
                    : "Thank you. Your response has been saved as an anonymised civic signal."}
                </p>
                <p className="note">
                  {isSimpleMode
                    ? "Now you can see what the group appears to be thinking and mark the statements that matter."
                    : "Next, you can see the shared group map and react to collective statements as a survey participant. You are not reacting to individual people's answers."}
                </p>
                {!isSimpleMode ? <dl className="field-list">
                  <div className="field">
                    <dt>Response ID</dt>
                    <dd>{savedWorkpack.response_id}</dd>
                  </div>
                  <div className="field">
                    <dt>Final summary</dt>
                    <dd>{savedWorkpack.final_summary}</dd>
                  </div>
                </dl> : null}
                <div className="actions">
                  <button className="button" type="button" onClick={loadHiveReview}>
                    {isSimpleMode ? "Start group review" : "Review group statements"}
                  </button>
                  <button className="button secondary" type="button" onClick={resetFlow}>
                    Submit another response
                  </button>
                </div>
              </section>
            ) : null}

            {savedWorkpack && phase === "groupReview" ? (
              <section className="stack">
                {!hiveReady ? (
                    <section className="card stack">
                      <p className="eyebrow">Group signal not ready yet</p>
                      <h2>More answers are needed before Mind Hive opens.</h2>
                    <p>
                      Your response is saved, but the group layer needs{" "}
                      {hiveResponsesNeeded} more response
                      {hiveResponsesNeeded === 1 ? "" : "s"} before collective
                      statements are shown.
                    </p>
                    <p className="note">
                      This avoids pretending one or two answers are a group opinion.
                    </p>
                    <button className="button secondary" type="button" onClick={resetFlow}>
                      Submit another response
                    </button>
                  </section>
                ) : (
                  <>
                    <section className="card stack">
                      <p className="eyebrow">
                        Mind Hive · statement {Math.min(hiveIndex + 1, sortedHiveStatements.length)} of{" "}
                        {sortedHiveStatements.length}
                      </p>
                      <h2>Review the group answers one at a time</h2>
                      <div className="progress-track" aria-hidden="true">
                        <span
                          style={{
                            width: `${((hiveIndex + 1) / Math.max(sortedHiveStatements.length, 1)) * 100}%`
                          }}
                        />
                      </div>
                      <p className="note">
                        These are interpreted group patterns from submitted survey
                        answers. React to this one, then move to the next.
                      </p>
                      <div className="pill-list">
                        <span className="pill">{hiveResponses} responses</span>
                        <span className="pill">{sortedHiveStatements.length} group patterns</span>
                        <span className="pill">No raw individual answers</span>
                      </div>
                    </section>

                    {currentHiveStatement ? (
                      <InlineHiveStatement
                        localReactions={localHiveReactions}
                        onReact={reactToHiveStatement}
                        statement={currentHiveStatement}
                      />
                    ) : null}

                    <div className="actions">
                      <button
                        className="button secondary"
                        disabled={hiveIndex === 0}
                        type="button"
                        onClick={() => setHiveIndex((index) => Math.max(0, index - 1))}
                      >
                        Previous
                      </button>
                      {hiveIndex < sortedHiveStatements.length - 1 ? (
                        <button
                          className="button"
                          type="button"
                          onClick={() =>
                            setHiveIndex((index) =>
                              Math.min(sortedHiveStatements.length - 1, index + 1)
                            )
                          }
                        >
                          Next group answer
                        </button>
                      ) : (
                        <button className="button" type="button" onClick={resetFlow}>
                          Finish
                        </button>
                      )}
                    </div>
                  </>
                )}
              </section>
            ) : null}

            {!isSimpleMode ? <ConversationPreview questions={questions} /> : null}
          </div>

          {!isSimpleMode ? <div className="stack">
            <StepIndicator
              activeStep={activeStep}
              questionIndex={questionIndex}
              questions={questions}
            />
            <SafeguardCard />
          </div> : null}
        </section>

        <footer className="footer">
          DeepAsk Live is a hackathon prototype. AI-generated follow-up questions
          and summaries are draft civic signals for human review, not final
          institutional conclusions.
        </footer>
      </div>
    </main>
  );
}
