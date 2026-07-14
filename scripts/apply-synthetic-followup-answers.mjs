import { readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

const answersFile = process.argv[2];
if (!answersFile) {
  throw new Error("Usage: node scripts/apply-synthetic-followup-answers.mjs <answers.json>");
}

const root = process.cwd();
const transcriptsPath = path.join(root, "fixtures/public-data-synthetic-transcripts.json");
const answersPath = path.resolve(root, answersFile);
const state = JSON.parse(await readFile(transcriptsPath, "utf8"));
const answers = JSON.parse(await readFile(answersPath, "utf8"));
const answerMap = new Map(
  answers.map((answer) => [`${answer.participant_id}:${answer.question_id}`, answer])
);
let applied = 0;

for (const participant of state) {
  for (const question of participant.questions) {
    const key = `${participant.id}:${question.question_id}`;
    const answer = answerMap.get(key);
    if (!answer) continue;
    const lastTurn = question.turns.at(-1);
    if (lastTurn?.role !== "ai" || lastTurn.type !== "followup") {
      throw new Error(`${key} does not have a pending AI follow-up`);
    }
    const followupCount = question.turns.filter(
      (turn) => turn.role === "ai" && turn.type === "followup"
    ).length;
    question.turns.push({
      role: "participant",
      type: "followup_answer",
      text: String(answer.answer || "").trim(),
      created_at: new Date().toISOString()
    });
    question.followup_target = answer.continue
      ? Math.min(3, followupCount + 1)
      : followupCount;
    applied += 1;
  }
}

if (applied !== answers.length) {
  throw new Error(`Applied ${applied} of ${answers.length} answers`);
}

const tempPath = `${transcriptsPath}.${process.pid}.tmp`;
await writeFile(tempPath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
await rename(tempPath, transcriptsPath);
console.log(`Applied ${applied} synthetic follow-up answers from ${answersFile}`);
