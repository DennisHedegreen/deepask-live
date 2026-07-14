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
    prompt_version: "synthetic-demo-v2",
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
  ),
  syntheticResponse(
    "007",
    [
      {
        initial: "Health-service planning should use reliable data to decide where mobile clinics and specialist capacity are most needed.",
        followup: "What information is currently missing from that decision?",
        detail: "Comparable travel times, waiting times, service outcomes, and unmet need across rural and urban areas.",
        theme: "Healthcare access planning"
      },
      {
        initial: "Waiting-time and outcome definitions should be shared, while regions retain local care pathways and demographic context.",
        followup: "Which local differences should remain visible?",
        detail: "Distance, age structure, language needs, and the availability of primary care should not disappear inside a common average.",
        theme: "Comparable health data with local context"
      },
      {
        initial: "AI-generated health patterns should require coverage checks, bias audits, and review by clinicians and patient representatives.",
        followup: "What decision should the AI never make on its own?",
        detail: "It should never automatically allocate or withdraw care; an accountable public authority must make and explain that decision.",
        theme: "Human accountability in health"
      }
    ],
    {
      theme: "Healthcare access with accountable planning",
      need: "Service averages can hide long journeys, unmet need, and unequal access between places.",
      improvement: "Combine shared access measures with regional context and mandatory human review of AI-derived patterns.",
      text: "Health data should support transparent service planning without erasing local access barriers, and AI may identify gaps only under visible evidence, bias checks, and accountable human judgement."
    }
  ),
  syntheticResponse(
    "008",
    [
      {
        initial: "Flood-adaptation funding should be prioritised using public data about exposure, critical infrastructure, and who is least able to recover.",
        followup: "What is missing from current risk maps?",
        detail: "Local drainage failures, recent land-use changes, and uncertainty about how different climate scenarios affect individual neighbourhoods.",
        theme: "Flood adaptation priorities"
      },
      {
        initial: "Europe can standardise core flood-risk scenarios, but municipalities must add terrain, drainage, and community knowledge.",
        followup: "Why is the local layer necessary?",
        detail: "The same rainfall can have very different consequences depending on streets, soil, housing, and local infrastructure.",
        theme: "Shared climate scenarios and local evidence"
      },
      {
        initial: "An AI pattern should show the scenario, source date, missing coverage, and uncertainty before it informs adaptation spending.",
        followup: "Who should challenge a misleading pattern?",
        detail: "Residents, technical experts, and the responsible local authority should all have a documented correction route.",
        theme: "Correctable climate-risk patterns"
      }
    ],
    {
      theme: "Climate adaptation with local evidence",
      need: "Broad risk maps can overlook recent local changes and unequal capacity to recover.",
      improvement: "Use shared scenarios with local infrastructure evidence, visible uncertainty, and a public correction process.",
      text: "Flood data should guide adaptation through comparable scenarios without flattening neighbourhood conditions, and AI-derived risk patterns must remain uncertain, challengeable, and accountable."
    }
  ),
  syntheticResponse(
    "009",
    [
      {
        initial: "School-capacity decisions would improve if enrolment forecasts were connected to housing growth, teacher availability, and travel time.",
        followup: "What problem would that connection prevent?",
        detail: "It could reveal where new housing is approved without enough classrooms, staff, or safe transport for children.",
        theme: "School capacity planning"
      },
      {
        initial: "Core capacity and staffing indicators can be common, but local language, inclusion, and transport needs must remain visible.",
        followup: "What should not be reduced to one European ranking?",
        detail: "The quality of inclusion for disabled pupils and minority-language communities depends on local services and cannot be read from one score.",
        theme: "Education standards with local inclusion"
      },
      {
        initial: "AI summaries should expose missing schools and groups, and be reviewed by educators, families, and the responsible authority.",
        followup: "What evidence should accompany a recommendation?",
        detail: "The underlying coverage, forecast assumptions, uncertainty, and plausible alternatives should all be visible.",
        theme: "Inspectable education planning"
      }
    ],
    {
      theme: "Education planning that keeps inclusion visible",
      need: "Separate datasets can hide mismatches between housing growth, school capacity, staffing, and access.",
      improvement: "Connect common planning indicators to local inclusion needs and inspectable human-reviewed forecasts.",
      text: "School planning should connect growth, capacity, staffing, and travel data while preserving local inclusion needs and requiring transparent, human-reviewed AI support."
    }
  ),
  syntheticResponse(
    "010",
    [
      {
        initial: "Public contract renewals should use data connecting the original decision, supplier, payments, service quality, and complaints.",
        followup: "What is difficult to see today?",
        detail: "Contract documents and spending records often use different identifiers, so poor outcomes are hard to connect to the supplier and renewal decision.",
        theme: "Procurement accountability"
      },
      {
        initial: "Supplier and contract identifiers should be standardised, while local authorities define the service outcomes communities actually need.",
        followup: "What should remain locally accountable?",
        detail: "The authority buying the service must explain its quality criteria and remain answerable for the renewal decision.",
        theme: "Shared procurement data and local outcomes"
      },
      {
        initial: "AI may flag unusual payments or repeated complaints, but every flag needs source links, uncertainty, and human investigation.",
        followup: "What would make an automated flag unsafe?",
        detail: "Treating correlation as proof of wrongdoing or hiding missing contract data could unfairly distort a public decision.",
        theme: "Bounded AI in procurement"
      }
    ],
    {
      theme: "Connected procurement evidence",
      need: "Disconnected identifiers make it hard to relate contracts and payments to service outcomes.",
      improvement: "Standardise core records while keeping local outcome definitions and final investigation accountable to people.",
      text: "Procurement data should connect decisions, suppliers, spending, and outcomes; AI can flag questions but cannot replace source-based investigation or accountable renewal decisions."
    }
  ),
  syntheticResponse(
    "011",
    [
      {
        initial: "Cross-border training policy would benefit from data connecting qualifications, vacancies, recognition delays, and worker mobility.",
        followup: "Which missing measure matters most?",
        detail: "Time lost between earning a qualification and having it recognised for a real vacancy in another country.",
        theme: "Cross-border skills recognition"
      },
      {
        initial: "A shared skills taxonomy can improve comparison, but language requirements, labour rules, and regional shortages need local context.",
        followup: "What risk comes from one common taxonomy?",
        detail: "It may label two jobs as equivalent while ignoring licensing, language, or workplace differences that matter in practice.",
        theme: "Comparable skills with national context"
      },
      {
        initial: "AI matching should explain which evidence produced a match and be audited for nationality, age, and gender bias.",
        followup: "Who should make the final eligibility decision?",
        detail: "A named human authority applying published rules, with a route for the worker to challenge errors or missing evidence.",
        theme: "Explainable and appealable matching"
      }
    ],
    {
      theme: "Cross-border skills without automated exclusion",
      need: "Workers and employers cannot easily see where recognition delays or incompatible classifications block mobility.",
      improvement: "Combine a shared skills language with national context, bias audits, explanations, and human appeal routes.",
      text: "Cross-border skills data should expose recognition barriers while respecting local rules, and AI matching must be explainable, audited, and subject to human decisions and appeal."
    }
  ),
  syntheticResponse(
    "012",
    [
      {
        initial: "Digital public-service design should use data about whether people can complete a task, including people using assistive technology or offline alternatives.",
        followup: "What does ordinary usage data fail to show?",
        detail: "A completed login does not show repeated errors, help from another person, or people who abandoned the service and used no alternative.",
        theme: "Accessible public services"
      },
      {
        initial: "Accessibility tests and core service measures should be shared, while local language, support channels, and co-design remain flexible.",
        followup: "Whose context is most likely to be missed?",
        detail: "People with less common disabilities, limited digital access, or minority languages can disappear when only average completion is compared.",
        theme: "Common accessibility measures and local co-design"
      },
      {
        initial: "AI-generated accessibility patterns should name missing groups and be reviewed directly with disabled people before informing service closure or redesign.",
        followup: "What decision boundary matters most?",
        detail: "AI must not justify removing human or offline support merely because the majority appears able to use the digital channel.",
        theme: "Missing perspectives in digital policy"
      }
    ],
    {
      theme: "Accessibility data that includes missing users",
      need: "Average completion data can hide abandoned tasks, informal assistance, and people excluded from digital services.",
      improvement: "Pair shared accessibility measures with local co-design, explicit missing-group warnings, and human decision boundaries.",
      text: "Digital-service data should measure real accessibility rather than average usage, keep uncommon perspectives visible, and prevent AI patterns from becoming a reason to remove necessary human support."
    }
  )
];

export function syntheticResponsesForSurvey(surveyId) {
  return surveyId === SURVEY_ID ? demoResponses : [];
}
