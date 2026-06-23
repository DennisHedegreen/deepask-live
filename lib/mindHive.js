export const REACTION_TYPES = [
  "agree",
  "important",
  "concern",
  "needsDiscussion",
  "missingPerspective"
];

const DEFAULT_REACTIONS = {
  agree: 0,
  important: 0,
  concern: 0,
  needsDiscussion: 0,
  missingPerspective: 0
};

const MIN_RESPONSES_FOR_GROUP_SIGNAL = 5;

const PATTERNS = [
  {
    id: "ai-assist-not-decide",
    title: "AI should assist, not decide",
    category: "AI",
    signalType: "agreement",
    keywords: ["ai", "human", "decide", "decision", "oversight", "automated", "automation"],
    summary:
      "Participants appear open to AI helping organize and summarize information, but final judgement should remain human."
  },
  {
    id: "transparent-process",
    title: "People want to understand how decisions are made",
    category: "Transparency",
    signalType: "agreement",
    keywords: ["transparent", "transparency", "clear", "unclear", "criteria", "judging", "process", "explain"],
    summary:
      "A recurring pattern is that people want clearer process, visible criteria, and understandable decisions."
  },
  {
    id: "efficiency-trust-balance",
    title: "Efficiency matters, but not at the cost of trust",
    category: "Trust",
    signalType: "tension",
    keywords: ["time", "fast", "efficiency", "efficient", "cost", "speed", "trust", "build"],
    summary:
      "Participants value saving time and reducing friction, but the process still has to feel trustworthy."
  },
  {
    id: "access-inclusion-core",
    title: "Access and inclusion are core concerns",
    category: "Inclusion",
    signalType: "concern",
    keywords: ["access", "inclusive", "inclusion", "language", "team", "alone", "mentor", "support", "barrier"],
    summary:
      "Several responses point toward access, inclusion, team formation, and support as central civic design issues."
  },
  {
    id: "automation-acceptable-level",
    title: "Participants differ on how much automation is acceptable",
    category: "Automation",
    signalType: "disagreement",
    keywords: ["automate", "automation", "manual", "human", "ai", "decide", "control"],
    summary:
      "There may be disagreement about where automation is useful and where human control must be mandatory."
  },
  {
    id: "minority-voice-protection",
    title: "Small concerns should not disappear in the average",
    category: "Minority concern",
    signalType: "minority view",
    keywords: ["minority", "missing", "excluded", "few", "quiet", "overwhelmed", "noise", "alone"],
    summary:
      "Some concerns may come from only a few participants, but still matter because they reveal who the process may exclude."
  }
];

const FALLBACK_STATEMENT = {
  id: "group-patterns-emerging",
  title: "Group patterns are beginning to emerge",
  category: "Open signal",
  signalType: "open question",
  summary:
    "The group map is still early. More responses are needed before strong shared patterns can be claimed.",
  keywords: []
};

export function buildMindHive(responses, savedReactions = {}) {
  const documents = responses.map(responseToDocument);
  const statements = PATTERNS.map((pattern) => buildStatement(pattern, documents, savedReactions))
    .filter((statement) => statement.responseCount > 0);

  if (!statements.length) {
    statements.push(buildStatement(FALLBACK_STATEMENT, documents, savedReactions));
  }

  const totalReactions = statements.reduce(
    (total, statement) =>
      total + Object.values(statement.reactions).reduce((sum, count) => sum + count, 0),
    0
  );
  const mostSupportedTheme = [...statements].sort(
    (a, b) => supportScore(b) - supportScore(a)
  )[0];
  const mostDebatedTheme = [...statements].sort(
    (a, b) => debateScore(b) - debateScore(a)
  )[0];

  return {
    overview: {
      totalSurveyResponses: responses.length,
      totalCollectiveStatements: statements.length,
      totalReactions,
      minimumResponsesForGroupSignal: MIN_RESPONSES_FOR_GROUP_SIGNAL,
      hasEnoughGroupSignal: responses.length >= MIN_RESPONSES_FOR_GROUP_SIGNAL,
      mostSupportedTheme: mostSupportedTheme?.title || "Not enough signal yet",
      mostDebatedTheme: mostDebatedTheme?.title || "Not enough signal yet"
    },
    statements,
    agreements: statements
      .filter((statement) => statement.signalType === "agreement")
      .sort((a, b) => supportScore(b) - supportScore(a)),
    tensions: statements
      .filter((statement) => ["disagreement", "tension", "open question"].includes(statement.signalType))
      .sort((a, b) => debateScore(b) - debateScore(a)),
    minorityConcerns: statements
      .filter((statement) => ["minority view", "concern"].includes(statement.signalType))
      .sort((a, b) => b.responseCount - a.responseCount),
    nextQuestions: buildNextQuestions(statements)
  };
}

function buildStatement(pattern, documents, savedReactions) {
  const related = documents.filter((document) => matchesPattern(document.text, pattern.keywords));
  const responseCount = pattern.id === FALLBACK_STATEMENT.id ? documents.length : related.length;
  return {
    id: pattern.id,
    title: pattern.title,
    summary: pattern.summary,
    category: pattern.category,
    signalType: pattern.signalType,
    responseCount,
    reactions: {
      ...DEFAULT_REACTIONS,
      ...(savedReactions[pattern.id] || {})
    }
  };
}

function responseToDocument(response) {
  const summary = response.ai_summary_draft || {};
  const questionSummaries = Array.isArray(summary.question_summaries)
    ? summary.question_summaries.map((item) => `${item.theme || ""} ${item.summary || ""}`)
    : [];
  const questionText = Array.isArray(response.questions)
    ? response.questions
        .map((question) => {
          const themes = (question.turns || [])
            .map((turn) => `${turn.theme || ""} ${turn.text || ""}`)
            .join(" ");
          return `${question.question || ""} ${themes}`;
        })
        .join(" ")
    : "";

  return {
    id: response.response_id,
    text: [
      summary.main_theme,
      summary.barrier_or_need,
      summary.suggested_improvement,
      summary.neutral_summary,
      response.final_summary,
      questionSummaries.join(" "),
      questionText
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
  };
}

function matchesPattern(text, keywords) {
  if (!keywords.length) return true;
  return keywords.some((keyword) => text.includes(keyword));
}

function supportScore(statement) {
  return statement.reactions.agree + statement.reactions.important + statement.responseCount;
}

function debateScore(statement) {
  return (
    statement.reactions.concern +
    statement.reactions.needsDiscussion +
    statement.reactions.missingPerspective +
    statement.responseCount
  );
}

function buildNextQuestions(statements) {
  const questions = [
    "Where should human oversight be mandatory?",
    "Which parts of public decision-making should never be automated?",
    "What would make citizens trust this system more?"
  ];

  if (statements.some((statement) => statement.id === "transparent-process")) {
    questions.push("What information should be visible before people trust a decision?");
  }

  if (statements.some((statement) => statement.id === "access-inclusion-core")) {
    questions.push("Who might still be excluded by this process, and what would help them participate?");
  }

  if (statements.some((statement) => statement.id === "efficiency-trust-balance")) {
    questions.push("Where is speed useful, and where would speed reduce trust?");
  }

  return [...new Set(questions)].slice(0, 5);
}
