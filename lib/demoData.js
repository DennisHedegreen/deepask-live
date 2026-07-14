import { SURVEY_ID } from "./constants";

const QUESTIONS = [
  "Which public decision in Europe would benefit most from better access to reliable public data, and what is currently missing?",
  "When public data is compared across countries or regions, what should be standardised—and what must remain sensitive to local context?",
  "What evidence, transparency, and human oversight should be required before AI-generated patterns from public responses can inform a public decision?"
];

function syntheticResponse(id, answers, summary) {
  return {
    response_id: `SYNTHETIC-${id}`,
    survey_id: SURVEY_ID,
    questions: answers.map((answer, index) => ({
      question_id: `Q${index + 1}`,
      question: QUESTIONS[index],
      turns: [
        { role: "participant", type: "initial_answer", text: answer.initial },
        { role: "ai", type: "followup", text: answer.followup, theme: answer.theme },
        { role: "participant", type: "followup_answer", text: answer.detail }
      ]
    })),
    ai_summary_draft: {
      main_theme: summary.theme,
      barrier_or_need: summary.need,
      suggested_improvement: summary.improvement,
      neutral_summary: summary.text,
      sensitive_data_flag: false
    },
    citizen_confirmed_summary: true,
    citizen_edited_summary: null,
    final_summary: summary.text,
    prompt_version: "synthetic-demo-v1",
    model_provider: "synthetic",
    model_name: "handwritten-example",
    created_at: "2026-07-14T12:00:00.000Z",
    synthetic: true
  };
}

export const demoResponses = [
  syntheticResponse(
    "001",
    [
      {
        initial: "Housing data could show where rents rise faster than incomes.",
        followup: "What would people need to compare for that data to be useful?",
        detail: "Comparable neighbourhood-level figures, updated regularly and linked to actual housing decisions.",
        theme: "Housing affordability"
      },
      {
        initial: "Local authorities should act, while national and European levels provide comparable standards.",
        followup: "Which decisions should remain local?",
        detail: "Local planning choices should stay close to the communities affected by them.",
        theme: "Local responsibility with shared standards"
      },
      {
        initial: "I would trust the AI more if every pattern linked back to sources and uncertainty.",
        followup: "What should happen when the AI gets a pattern wrong?",
        detail: "People should be able to challenge it and a human should correct the group map.",
        theme: "Transparent and correctable AI"
      }
    ],
    {
      theme: "Housing data connected to decisions",
      need: "Comparable local housing data can be hard to connect to policy choices.",
      improvement: "Use shared standards while keeping planning decisions locally accountable.",
      text: "Better housing data should support real local decisions, use comparable standards, and remain transparent and correctable when AI identifies patterns."
    }
  ),
  syntheticResponse(
    "002",
    [
      {
        initial: "Transport data could reveal which rural areas are cut off from jobs and services.",
        followup: "Which missing comparison matters most?",
        detail: "Travel time and reliability, not just whether a bus route exists on a map.",
        theme: "Rural transport access"
      },
      {
        initial: "Regions should coordinate routes, but municipalities know which local connections fail.",
        followup: "What should the national level contribute?",
        detail: "Funding and common data formats so gaps can be compared across regions.",
        theme: "Regional coordination"
      },
      {
        initial: "I would distrust a system that treats the largest group as the only important one.",
        followup: "What should it show instead?",
        detail: "It should surface minority and rural perspectives even when only a few people mention them.",
        theme: "Minority perspectives"
      }
    ],
    {
      theme: "Transport gaps and minority perspectives",
      need: "Rural access can disappear when data measures routes instead of reliable journeys.",
      improvement: "Combine common formats with local knowledge and make minority signals visible.",
      text: "Public transport data should reveal real access gaps, coordinate responsibility across levels, and prevent smaller rural perspectives from disappearing in the average."
    }
  ),
  syntheticResponse(
    "003",
    [
      {
        initial: "Energy data could help households understand heating costs and local retrofit needs.",
        followup: "What would turn that understanding into action?",
        detail: "Clear neighbourhood comparisons connected to grants and practical advice.",
        theme: "Energy and heat"
      },
      {
        initial: "National government can fund the transition, while cities target programmes locally.",
        followup: "Where could Europe add value?",
        detail: "Shared standards for energy performance and evidence about what works.",
        theme: "Layered responsibility"
      },
      {
        initial: "Trust requires an explanation of how answers become a theme.",
        followup: "How detailed should that explanation be?",
        detail: "Enough to inspect the sources and assumptions without exposing individual answers.",
        theme: "Explainable aggregation"
      }
    ],
    {
      theme: "Energy data people can act on",
      need: "Households need understandable local evidence connected to available support.",
      improvement: "Link local programmes to shared standards and explain how AI-derived themes are formed.",
      text: "Energy data becomes useful when it leads to practical support, responsibility is shared across levels, and group patterns can be inspected without exposing people."
    }
  ),
  syntheticResponse(
    "004",
    [
      {
        initial: "Waiting-time data could make access to public services easier to understand.",
        followup: "What could the numbers fail to show?",
        detail: "A short average can hide long waits for people with uncommon or complex needs.",
        theme: "Public service access"
      },
      {
        initial: "National standards are useful, but regions need room to respond to different populations.",
        followup: "How could those approaches stay comparable?",
        detail: "Keep a small common dataset and let regions add local measures and context.",
        theme: "Common core with local context"
      },
      {
        initial: "The system should show uncertainty instead of presenting every pattern as a fact.",
        followup: "Who should review uncertain patterns?",
        detail: "Participants and responsible public staff should both be able to flag them.",
        theme: "Visible uncertainty"
      }
    ],
    {
      theme: "Public-service data with context",
      need: "Averages and common indicators can hide uncommon needs and local variation.",
      improvement: "Pair shared measures with local context, visible uncertainty, and human review.",
      text: "Public-service data should be comparable without erasing local context or uncommon needs, and AI patterns should show uncertainty and remain open to human review."
    }
  ),
  syntheticResponse(
    "005",
    [
      {
        initial: "Environmental data could show who is most exposed to heat and air pollution.",
        followup: "What would make that information useful locally?",
        detail: "Street-level coverage combined with information about schools, housing, and green space.",
        theme: "Environmental exposure"
      },
      {
        initial: "European standards can make pollution data comparable, while cities choose interventions.",
        followup: "What risk comes with common standards?",
        detail: "They can miss local hotspots if the measurement network has gaps.",
        theme: "Shared standards and local gaps"
      },
      {
        initial: "I would distrust AI that hides which areas or groups are missing from the data.",
        followup: "How should missing data appear?",
        detail: "As an explicit gap or warning, not as a confident conclusion.",
        theme: "Missing data visibility"
      }
    ],
    {
      theme: "Environmental data and visible gaps",
      need: "Common environmental indicators may overlook neighbourhood hotspots and missing coverage.",
      improvement: "Use comparable standards while visibly marking local gaps and uncertainty.",
      text: "Environmental data should combine shared standards with local detail, while AI must expose missing coverage rather than turn incomplete data into a confident claim."
    }
  ),
  syntheticResponse(
    "006",
    [
      {
        initial: "Budget data could help people see whether public promises lead to actual spending.",
        followup: "What connection is currently hard to see?",
        detail: "The link between a political decision, the allocated budget, and the result in a community.",
        theme: "Budget accountability"
      },
      {
        initial: "Every level should publish its part, using identifiers that connect the same programme across systems.",
        followup: "Who should remain accountable for the result?",
        detail: "The authority making the decision should remain clearly named and answerable.",
        theme: "Connected data and clear accountability"
      },
      {
        initial: "AI can surface patterns, but it should never decide whether a programme succeeded.",
        followup: "What should make that judgement instead?",
        detail: "Published evidence, affected communities, and accountable human decision-makers.",
        theme: "AI assists rather than decides"
      }
    ],
    {
      theme: "Budget transparency and accountability",
      need: "People struggle to connect public decisions, spending, and real outcomes.",
      improvement: "Connect datasets across levels while keeping final judgement and accountability human.",
      text: "Budget data should connect decisions to spending and outcomes, while AI surfaces patterns without replacing evidence, affected communities, or accountable human judgement."
    }
  )
];

export function syntheticResponsesForSurvey(surveyId) {
  return surveyId === SURVEY_ID ? demoResponses : [];
}
