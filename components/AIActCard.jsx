export default function AIActCard({ compact = false }) {
  return (
    <section className="card stack">
      <div>
        <p className="eyebrow">AI Act transparency card</p>
        <h2>How DeepAsk uses AI</h2>
      </div>
      <p>
        DeepAsk uses AI to ask neutral follow-up questions and draft summaries of
        participant answers. It does not make legal, financial, employment,
        education, welfare, migration, law-enforcement, or access decisions.
      </p>
      <div className="pill-list">
        <span className="pill">Likely transparency / limited-risk use</span>
        <span className="pill">Not a decision system</span>
        <span className="pill">Human review required</span>
      </div>
      {!compact ? (
        <dl className="field-list">
          <div className="field">
            <dt>AI role</dt>
            <dd>
              Clarify answers, draft summaries, and help organise collective
              group patterns.
            </dd>
          </div>
          <div className="field">
            <dt>Human role</dt>
            <dd>
              Participants can confirm or edit summaries. Organisers review
              outputs and remain responsible for interpretation and action.
            </dd>
          </div>
          <div className="field">
            <dt>Current classification</dt>
            <dd>
              Treated as a transparency / limited-risk civic feedback prototype
              when used only for listening, summarising, and group-signal review.
            </dd>
          </div>
          <div className="field">
            <dt>Boundary</dt>
            <dd>
              If DeepAsk is used to decide access to jobs, education, credit,
              welfare, migration status, public services, or other essential
              rights, the risk classification must be reassessed before use.
            </dd>
          </div>
        </dl>
      ) : null}
      <p className="warning">
        AI output is interpretation, not truth. Original answers stay separate
        from AI summaries for auditability.
      </p>
    </section>
  );
}
