import { readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const transcripts = JSON.parse(
  await readFile(path.join(root, "fixtures/public-data-synthetic-transcripts.json"), "utf8")
);
const summaries = JSON.parse(
  await readFile(path.join(root, "fixtures/public-data-synthetic-summary-drafts.json"), "utf8")
);
const summaryMap = new Map(summaries.map((summary) => [summary.participant_id, summary]));
const surveyId = "public-data-possibilities";
const batchId = "public-data-subagents-2026-07-15";

const responses = transcripts.map((participant, participantIndex) => {
  const summary = summaryMap.get(participant.id);
  if (!summary) throw new Error(`Missing summary for ${participant.id}`);
  const questions = participant.questions.map((question) => {
    const followupCount = question.turns.filter(
      (turn) => turn.role === "ai" && turn.type === "followup"
    ).length;
    const followupAnswers = question.turns.filter(
      (turn) => turn.role === "participant" && turn.type === "followup_answer"
    ).length;
    if (followupCount < 1 || followupCount > 3 || followupCount !== followupAnswers) {
      throw new Error(
        `${participant.id}/${question.question_id} has ${followupCount} follow-ups and ${followupAnswers} answers`
      );
    }
    if (question.turns.at(-1)?.role !== "participant") {
      throw new Error(`${participant.id}/${question.question_id} ends with an unanswered AI turn`);
    }
    return {
      question_id: question.question_id,
      question: question.question,
      status: "completed",
      followup_count: followupCount,
      turns: question.turns
    };
  });
  const createdAt = new Date(Date.UTC(2026, 6, 15, 0, participantIndex, 0)).toISOString();
  const { participant_id: _participantId, ...summaryFields } = summary;
  const aiSummaryDraft = {
    ...summaryFields,
    model_provider: "synthetic-agent-run",
    model_name: "independent-neutral-summary-agent"
  };

  return {
    response_id: participant.id,
    survey_id: surveyId,
    questionnaire: questions.map(({ question_id, question }) => ({ question_id, question })),
    questions,
    ai_summary_draft: aiSummaryDraft,
    citizen_confirmed_summary: true,
    citizen_edited_summary: null,
    final_summary: summary.neutral_summary,
    prompt_version: "synthetic-agent-interview-v1",
    model_provider: "synthetic-agent-run",
    model_name: "independent-neutral-summary-agent",
    created_at: createdAt,
    synthetic: true,
    response_origin: "synthetic",
    synthetic_persona: participant.persona,
    synthetic_context: participant.context,
    synthetic_batch_id: batchId,
    summary_confirmation: "approved-by-originating-participant-agent"
  };
});

if (responses.length !== 10) throw new Error(`Expected 10 responses, found ${responses.length}`);
if (new Set(responses.map((response) => response.response_id)).size !== responses.length) {
  throw new Error("Synthetic response IDs must be unique");
}

const outputPath = path.join(root, "fixtures/public-data-synthetic-responses.json");
const tempPath = `${outputPath}.${process.pid}.tmp`;
await writeFile(tempPath, `${JSON.stringify(responses, null, 2)}\n`, "utf8");
await rename(tempPath, outputPath);

const followupCounts = responses.map((response) =>
  response.questions.reduce((total, question) => total + question.followup_count, 0)
);
console.log(
  `Built ${responses.length} approved synthetic responses with ${followupCounts.reduce((a, b) => a + b, 0)} answered follow-ups (${followupCounts.join(", ")})`
);
