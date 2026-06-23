export const demoResponses = [
  {
    response_id: "DEMO-001",
    survey_id: "hackathon-comet-2026",
    question_1:
      "What would make this hackathon more useful, inclusive, or meaningful for you?",
    answer_1_original:
      "It would help if the challenge was clearer and teams had more time to build instead of discussing what the problem means.",
    ai_followup: {
      theme: "Clearer challenge framing",
      follow_up_question:
        "What part of the challenge framing would you most like to see clarified?"
    },
    answer_2_original:
      "The expected outcome should be clearer. We need to know whether we are building a policy idea, a prototype, or a pitch.",
    ai_summary_draft: {
      main_theme: "Clearer challenge framing",
      barrier_or_need: "Unclear expectations for what teams should produce",
      suggested_improvement:
        "Define the expected outcome and success criteria earlier.",
      neutral_summary:
        "The participant wants clearer challenge framing, especially around whether teams should produce a policy concept, working prototype, or pitch.",
      sensitive_data_flag: false
    },
    citizen_confirmed_summary: true,
    citizen_edited_summary: null,
    final_summary:
      "The participant wants clearer challenge framing, especially around whether teams should produce a policy concept, working prototype, or pitch.",
    prompt_version: "v0.1",
    model_provider: "demo",
    model_name: "demo-fallback",
    created_at: new Date().toISOString()
  },
  {
    response_id: "DEMO-002",
    survey_id: "hackathon-comet-2026",
    question_1:
      "What would make this hackathon more useful, inclusive, or meaningful for you?",
    answer_1_original:
      "More technical support would make it easier for mixed teams to actually build something.",
    ai_followup: {
      theme: "Need better technical support",
      follow_up_question:
        "What kind of technical support would help your team most?"
    },
    answer_2_original:
      "Someone available to answer deployment and API questions would save time.",
    ai_summary_draft: {
      main_theme: "Need better technical support",
      barrier_or_need: "Teams lose time on setup and deployment problems",
      suggested_improvement:
        "Provide a visible technical support desk for API and deployment questions.",
      neutral_summary:
        "The participant suggests adding practical technical support, especially for deployment and API questions, so teams can spend more time building.",
      sensitive_data_flag: false
    },
    citizen_confirmed_summary: true,
    citizen_edited_summary: null,
    final_summary:
      "The participant suggests adding practical technical support, especially for deployment and API questions, so teams can spend more time building.",
    prompt_version: "v0.1",
    model_provider: "demo",
    model_name: "demo-fallback",
    created_at: new Date().toISOString()
  },
  {
    response_id: "DEMO-003",
    survey_id: "hackathon-comet-2026",
    question_1:
      "What would make this hackathon more useful, inclusive, or meaningful for you?",
    answer_1_original:
      "Team formation could be more inclusive. It is hard to join if you do not already know people.",
    ai_followup: {
      theme: "More inclusive team formation",
      follow_up_question:
        "What would make team formation easier for people who arrive without a group?"
    },
    answer_2_original:
      "A short structured matching round based on skills and interests would help.",
    ai_summary_draft: {
      main_theme: "More inclusive team formation",
      barrier_or_need: "Participants without existing contacts may struggle to join teams",
      suggested_improvement:
        "Run a structured matching round based on skills and interests.",
      neutral_summary:
        "The participant wants a more inclusive team formation process, with structured matching so people without an existing group can join more easily.",
      sensitive_data_flag: false
    },
    citizen_confirmed_summary: true,
    citizen_edited_summary: null,
    final_summary:
      "The participant wants a more inclusive team formation process, with structured matching so people without an existing group can join more easily.",
    prompt_version: "v0.1",
    model_provider: "demo",
    model_name: "demo-fallback",
    created_at: new Date().toISOString()
  }
];
