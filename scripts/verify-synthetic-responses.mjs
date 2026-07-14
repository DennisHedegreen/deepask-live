import { readFile } from "node:fs/promises";

const responses = JSON.parse(
  await readFile("fixtures/public-data-synthetic-responses.json", "utf8")
);
const patterns = JSON.parse(
  await readFile("fixtures/public-data-synthetic-patterns.json", "utf8")
);
const retiredGenericFollowup =
  "What specific example, data point, or decision would make this clearer?";

assert(responses.length === 10, `expected 10 responses, found ${responses.length}`);
assert(new Set(responses.map((response) => response.response_id)).size === 10, "duplicate response IDs");

let totalFollowups = 0;
for (const response of responses) {
  assert(response.synthetic === true, `${response.response_id} is not synthetic-labelled`);
  assert(response.response_origin === "synthetic", `${response.response_id} has the wrong origin`);
  assert(response.citizen_confirmed_summary === true, `${response.response_id} summary is not approved`);
  assert(response.final_summary === response.ai_summary_draft?.neutral_summary, `${response.response_id} final summary drift`);
  assert(response.questions?.length === 3, `${response.response_id} does not answer all 3 questions`);
  for (const question of response.questions) {
    const aiTurns = question.turns.filter(
      (turn) => turn.role === "ai" && turn.type === "followup"
    );
    const followupAnswers = question.turns.filter(
      (turn) => turn.role === "participant" && turn.type === "followup_answer"
    );
    assert(
      aiTurns.every((turn) => turn.model_provider && turn.model_name),
      `${response.response_id}/${question.question_id} has unlabelled follow-up provenance`
    );
    assert(
      aiTurns.every((turn) => turn.text !== retiredGenericFollowup),
      `${response.response_id}/${question.question_id} contains retired generic fallback`
    );
    assert(aiTurns.length >= 1 && aiTurns.length <= 3, `${response.response_id}/${question.question_id} follow-up range`);
    assert(aiTurns.length === followupAnswers.length, `${response.response_id}/${question.question_id} unanswered follow-up`);
    assert(question.followup_count === aiTurns.length, `${response.response_id}/${question.question_id} count mismatch`);
    assert(question.turns.at(-1)?.role === "participant", `${response.response_id}/${question.question_id} dangling AI turn`);
    totalFollowups += aiTurns.length;
  }
}

assert(totalFollowups === 35, `expected 35 answered follow-ups, found ${totalFollowups}`);
const responseIds = new Set(responses.map((response) => response.response_id));
assert(patterns.length === 7, `expected 7 derived patterns, found ${patterns.length}`);
for (const pattern of patterns) {
  assert(pattern.seedEvidenceResponseIds?.length >= 2, `${pattern.id} is not a group pattern`);
  assert(
    new Set(pattern.seedEvidenceResponseIds).size === pattern.seedEvidenceResponseIds.length,
    `${pattern.id} has duplicate evidence IDs`
  );
  assert(
    pattern.seedEvidenceResponseIds.every((responseId) => responseIds.has(responseId)),
    `${pattern.id} cites an unknown response ID`
  );
}
console.log("OK   10 synthetic participant workpacks");
console.log("OK   30 answered main questions");
console.log("OK   35 answered follow-ups, 1–3 allowed per question");
console.log("OK   10 participant-approved summaries");
console.log("OK   7 collective patterns with unique response evidence");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
