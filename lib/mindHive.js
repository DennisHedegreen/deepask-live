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
    id: "data-connected-to-decisions",
    title: "Useful public data must connect to real decisions",
    category: "Public value",
    signalType: "agreement",
    keywords: [
      "decision", "decisions", "useful", "understand", "housing", "transport",
      "energy", "heating", "service", "services", "budget", "spending", "outcome"
    ],
    summary:
      "The example responses repeatedly connect better data to practical choices about housing, transport, energy, services, and public spending."
  },
  {
    id: "responsibility-close-to-communities",
    title: "Responsibility should remain close to affected communities",
    category: "Governance",
    signalType: "agreement",
    keywords: [
      "local", "locally", "municipality", "municipalities", "city", "cities",
      "community", "communities", "region", "regional", "accountable", "authority"
    ],
    summary:
      "Local and regional actors appear best placed to understand context, while the authority making a decision should remain visibly accountable."
  },
  {
    id: "shared-standards-local-context",
    title: "Shared standards can help without erasing local context",
    category: "Coordination",
    signalType: "tension",
    keywords: [
      "standards", "standard", "comparable", "compare", "common", "shared",
      "format", "formats", "europe", "european", "national", "context", "local"
    ],
    summary:
      "Common formats and comparable indicators can support coordination, but they may miss local variation unless communities can add context."
  },
  {
    id: "transparent-correctable-ai",
    title: "AI-derived patterns should be transparent and correctable",
    category: "AI trust",
    signalType: "concern",
    keywords: [
      "trust", "distrust", "transparent", "explain", "explanation", "source",
      "sources", "uncertainty", "correct", "correctable", "challenge", "inspect", "review"
    ],
    summary:
      "Trust depends on visible sources and uncertainty, plus a meaningful way for participants and responsible humans to challenge or correct a pattern."
  },
  {
    id: "missing-data-visible",
    title: "Missing data and smaller perspectives must stay visible",
    category: "Inclusion",
    signalType: "minority view",
    keywords: [
      "missing", "gap", "gaps", "minority", "rural", "uncommon", "smaller",
      "overlook", "hide", "hidden", "coverage", "average", "excluded"
    ],
    summary:
      "Incomplete coverage and minority perspectives can disappear behind averages. The group map should expose those gaps instead of presenting false certainty."
  },
  {
    id: "ai-surface-not-decide",
    title: "AI may surface patterns, but it should not make the decision",
    category: "Human judgement",
    signalType: "agreement",
    keywords: [
      "ai", "pattern", "patterns", "human", "decide", "decision", "judgement",
      "judge", "oversight", "responsible", "accountable", "evidence"
    ],
    summary:
      "The AI can organise and summarise input, while evidence, affected communities, and accountable people remain responsible for judgement."
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
  const patterns = patternSetForResponses(responses);
  const statements = patterns.map((pattern) => buildStatement(pattern, documents, savedReactions))
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

function patternSetForResponses(responses) {
  return PATTERNS;
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
  return keywords.some((keyword) => {
    const pattern = new RegExp(`(^|[^a-z0-9-])${escapeRegExp(keyword)}([^a-z0-9-]|$)`, "i");
    return pattern.test(text);
  });
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
    "Which public decision would benefit most from better-connected data?",
    "What should be standardised across Europe, and what should remain local?",
    "What evidence would make an AI-derived group pattern trustworthy?"
  ];

  if (statements.some((statement) => statement.id === "transparent-correctable-ai")) {
    questions.push("How should participants challenge or correct a misleading pattern?");
  }

  if (statements.some((statement) => statement.id === "missing-data-visible")) {
    questions.push("Which missing groups or places should the data gap warning name explicitly?");
  }

  if (statements.some((statement) => statement.id === "shared-standards-local-context")) {
    questions.push("How can common indicators preserve enough local context to guide action?");
  }

  return [...new Set(questions)].slice(0, 5);
}
