function questionKind(question) {
  const text = String(question || "").toLowerCase();
  if (text.includes("standardis") || text.includes("compared across")) return "comparison";
  if (text.includes("ai-generated") || text.includes("human oversight")) return "oversight";
  return "decision";
}

function answerTheme(answer) {
  const text = String(answer || "").toLowerCase();
  const themes = [
    [/\b(housing|rent|rents|rental)\b/, "housing"],
    [/\b(transport|bus|rail|travel)\b/, "transport access"],
    [/\b(health|healthcare|patient)\b/, "healthcare access"],
    [/\b(climate|flood|heat)\b/, "climate adaptation"],
    [/\b(procurement|tender|contractor|subcontractor)\b/, "public procurement"],
    [/\b(labour|worker|workers|employment|skills)\b/, "labour-market transition"],
    [/\b(disability|disabled|accessibility|inaccessible)\b/, "accessibility"],
    [/\b(migration|migrant|language|multilingual|residency)\b/, "access to public services"],
    [/\b(budget|spending|funds)\b/, "public spending"],
    [/\bdata\b/, "the proposed public-data evidence"]
  ];
  return themes.find(([pattern]) => pattern.test(text))?.[1] || "that evidence";
}

export function generateFallbackFollowup({ question, latestAnswer, followupCount = 0 }) {
  const kind = questionKind(question);
  const index = Math.max(0, Math.min(2, Number(followupCount || 0)));
  const theme = answerTheme(latestAnswer);
  const prompts = {
    decision: [
      `Which missing dataset or measure would most improve the ${theme} decision, and who should publish it?`,
      `How should the ${theme} evidence be updated or checked so decision-makers can rely on it?`,
      `What concrete public decision should change if the ${theme} evidence shows a serious gap?`
    ],
    comparison: [
      "Which shared definition or indicator should be standardised first, and which local difference must always be shown beside it?",
      "How should a comparison display missing data and local exceptions without hiding them inside one ranking?",
      "Who should maintain the shared standard, and how should local deviations be documented?"
    ],
    oversight: [
      "Who should be able to inspect or challenge an AI-derived pattern, and what underlying evidence should they see?",
      "What should happen when reviewers find missing groups, weak evidence, or a misleading pattern?",
      "Which public decision should never rely on this pattern without additional human judgement?"
    ]
  };

  return {
    theme: `${theme[0].toUpperCase()}${theme.slice(1)}`,
    follow_up_question: prompts[kind][index],
    should_continue: index < 2,
    model_provider: "local-fallback",
    model_name: "deepask-contextual-fallback-v1"
  };
}
