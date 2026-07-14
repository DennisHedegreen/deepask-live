const target = normaliseTarget(
  process.argv[2] || process.env.DEEPASK_SMOKE_URL || "http://127.0.0.1:3100/deepask"
);
const surveyId = "public-data-possibilities";
const question =
  "Which public decision in Europe would benefit most from better access to reliable public data, and what is currently missing?";
const initialAnswer =
  "Public transport data could help people understand which neighbourhoods cannot reliably reach jobs and public services.";

const followup = await post("/api/followup", {
  question,
  turns: [
    { role: "participant", type: "initial_answer", text: initialAnswer }
  ],
  latest_answer: initialAnswer,
  followup_count: 0,
  followup_limit: 1
});

assert(followup.follow_up_question, "follow-up question missing");

const questions = [
  {
    question_id: "Q1",
    question,
    status: "completed",
    followup_count: 1,
    turns: [
      { role: "participant", type: "initial_answer", text: initialAnswer },
      {
        role: "ai",
        type: "followup",
        text: followup.follow_up_question,
        theme: followup.theme
      },
      {
        role: "participant",
        type: "followup_answer",
        text: "Reliability and total travel time should be compared, not only whether a route exists."
      }
    ]
  }
];

const summary = await post("/api/summary", { questions });
assert(summary.neutral_summary, "neutral summary missing");

const submitted = await post("/api/responses", {
  survey_id: surveyId,
  questions,
  ai_summary_draft: summary,
  citizen_confirmed_summary: true,
  final_summary: summary.neutral_summary
});
const token = submitted.workpack?.reaction_token;
assert(token, "participant reaction token missing");

const hiveResponse = await fetch(
  `${target}/api/mind-hive?survey_id=${encodeURIComponent(surveyId)}`,
  { cache: "no-store" }
);
assert(hiveResponse.ok, `mind hive returned HTTP ${hiveResponse.status}`);
const mindHive = await hiveResponse.json();
assert(mindHive.usingDemo === true, "synthetic demo flag missing");
assert(
  mindHive.hive?.overview?.syntheticResponseCount === 6,
  "expected six synthetic example responses"
);
assert(
  mindHive.hive?.overview?.submittedResponseCount >= 1,
  "submitted response was not counted separately"
);

const statementId = mindHive.hive?.statements?.[0]?.id;
assert(statementId, "collective statement missing");
const reaction = await post("/api/mind-hive/reactions", {
  survey_id: surveyId,
  statement_id: statementId,
  reaction_type: "important",
  participant_token: token
});
assert(reaction.hive?.overview, "reaction did not return updated Mind Hive");
assert(reaction.usingDemo === true, "synthetic label was lost after reaction");

console.log("OK   adaptive follow-up");
console.log("OK   participant-confirmed summary");
console.log("OK   response stored with reaction token");
console.log("OK   six synthetic examples labelled separately");
console.log("OK   participant reaction saved");
console.log(`DeepAsk demo flow passed for ${target}`);

async function post(path, payload) {
  const response = await fetch(`${target}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(`${path} returned HTTP ${response.status}: ${data.error || "unknown error"}`);
  }
  return data;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function normaliseTarget(value) {
  return String(value || "").trim().replace(/\/+$/g, "");
}
