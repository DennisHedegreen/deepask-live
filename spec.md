# DeepAsk Live — Codex Plan Mode Spec

## Project summary

Build a working hackathon prototype called **DeepAsk Live**.

DeepAsk Live is an adaptive civic listening tool. A participant answers one open-ended question. The system uses an LLM to generate one neutral follow-up question. The participant answers again. The system generates a structured neutral summary, asks the participant to confirm or edit it, then stores the completed response as an auditable “workpack”. A dashboard shows aggregated civic signals.

This is a real working prototype, not a mockup.

The prototype is for an EU Civic Tech Hackathon demo. Keep the implementation simple, stable, and demo-ready.

---

## Core concept

Traditional surveys often collect either shallow ratings or unstructured free-text answers.

DeepAsk starts with the citizen’s own words, then uses AI to ask one neutral follow-up question to clarify meaning.

The AI must not persuade, debate, judge, profile, or change the participant’s meaning.

The AI only helps clarify and structure feedback.

---

## Demo survey question

Use this as the main public demo question:

> What would make this hackathon more useful, inclusive, or meaningful for you?

This keeps the demo low-risk and directly relevant to the event.

---

## Required user flow

### Step 1 — Survey start

Page: `/`

Show:

Title:

> DeepAsk Live

Subtitle:

> Answer in your own words. DeepAsk will ask one neutral follow-up question to better understand your response.

Main question:

> What would make this hackathon more useful, inclusive, or meaningful for you?

Input:

* Large textarea
* Button: `Continue`

Display warning:

> Please do not include sensitive personal information.

Display short safeguard note:

> AI is used only to ask a neutral follow-up question and summarise themes. It does not persuade, judge, or decide.

---

### Step 2 — AI follow-up

After user submits first answer:

Call backend endpoint:

`POST /api/followup`

Backend sends first answer to OpenAI.

The AI returns:

* `theme`
* `follow_up_question`

Show:

Heading:

> Follow-up question

Display generated question.

Input:

* Large textarea for second answer
* Button: `Generate summary`

---

### Step 3 — AI summary

After user submits second answer:

Call backend endpoint:

`POST /api/summary`

The AI returns:

* `main_theme`
* `barrier_or_need`
* `suggested_improvement`
* `neutral_summary`
* `sensitive_data_flag`

Show these fields to the participant.

Then ask:

> Does this summary reflect what you meant?

Buttons:

* `Yes, submit`
* `Edit summary`

If user clicks `Edit summary`, allow them to edit `neutral_summary`.

Then user clicks:

* `Submit final response`

---

### Step 4 — Store response workpack

When submitted, store a complete response workpack.

Important:
Original participant text must remain separate from AI interpretation.

This is a core governance principle.

---

### Step 5 — Thank-you page

Show:

> Thank you. Your response has been saved as an anonymised civic signal.

Also show:

> The original response remains separate from the AI summary for auditability.

---

### Step 6 — Dashboard

Page: `/dashboard`

Show:

* Total number of submitted responses
* Theme counts
* Common barriers/needs
* Suggested improvements
* Response cards

Each response card shows:

* response_id
* main_theme
* barrier_or_need
* suggested_improvement
* neutral_summary
* citizen_confirmed_summary
* sensitive_data_flag
* timestamp

Do not show raw participant answers by default.

Add a button or expandable section:

> Show raw answers for audit/demo

This is acceptable for hackathon demo.

---

## Response workpack schema

Store each completed response as:

```json
{
  "response_id": "R-001",
  "survey_id": "hackathon-comet-2026",
  "question_1": "What would make this hackathon more useful, inclusive, or meaningful for you?",
  "answer_1_original": "",
  "ai_followup": {
    "theme": "",
    "follow_up_question": ""
  },
  "answer_2_original": "",
  "ai_summary_draft": {
    "main_theme": "",
    "barrier_or_need": "",
    "suggested_improvement": "",
    "neutral_summary": "",
    "sensitive_data_flag": false
  },
  "citizen_confirmed_summary": false,
  "citizen_edited_summary": null,
  "final_summary": "",
  "prompt_version": "v0.1",
  "model_provider": "openai",
  "model_name": "",
  "created_at": ""
}
```

Principle:

> Original voice stays separate from machine interpretation.

---

## Backend endpoint: `/api/followup`

Method:

`POST`

Input:

```json
{
  "answer_1": "..."
}
```

Output:

```json
{
  "theme": "...",
  "follow_up_question": "..."
}
```

### Follow-up system prompt

Use this prompt server-side:

```text
You are an assistant for a civic participation survey.

Your task is to ask ONE neutral follow-up question based on the participant's answer.

Rules:
- Do not persuade the participant.
- Do not challenge their opinion.
- Do not introduce political arguments.
- Do not ask leading questions.
- Do not collect sensitive personal data.
- Ask only one short, clear follow-up question.
- The goal is to clarify the reason behind their answer.
- Use plain language.
- Keep the question relevant to the participant's answer.
- If the answer contains sensitive personal data, do not repeat the sensitive details. Ask a safe, general clarification question.

Return JSON only:
{
  "theme": "...",
  "follow_up_question": "..."
}
```

User content:

```text
Participant answer:
"{answer_1}"
```

---

## Backend endpoint: `/api/summary`

Method:

`POST`

Input:

```json
{
  "answer_1": "...",
  "follow_up_question": "...",
  "answer_2": "..."
}
```

Output:

```json
{
  "main_theme": "...",
  "barrier_or_need": "...",
  "suggested_improvement": "...",
  "neutral_summary": "...",
  "sensitive_data_flag": false
}
```

### Summary system prompt

Use this prompt server-side:

```text
You are summarising a participant's response for a civic participation dashboard.

Rules:
- Summarise neutrally.
- Do not infer political affiliation.
- Do not diagnose, profile, or judge the person.
- Do not change the participant's meaning.
- Focus on barriers, needs, concerns, and suggested improvements.
- Do not include unnecessary personal details.
- If sensitive personal data appears, set sensitive_data_flag to true and avoid repeating the sensitive details.
- Keep the summary short and clear.
- Return JSON only.

Return:
{
  "main_theme": "...",
  "barrier_or_need": "...",
  "suggested_improvement": "...",
  "neutral_summary": "...",
  "sensitive_data_flag": true_or_false
}
```

User content:

```text
Original question:
"What would make this hackathon more useful, inclusive, or meaningful for you?"

Participant first answer:
"{answer_1}"

AI follow-up question:
"{follow_up_question}"

Participant follow-up answer:
"{answer_2}"
```

---

## Technical requirements

Preferred stack:

* Next.js
* React
* API routes
* OpenAI API
* Simple local JSON file storage
* Basic CSS or Tailwind if already available

Keep it simple.

No login.
No user accounts.
No complex database.
No authentication.
No multi-language implementation.
No charts unless very quick.

---

## API key security

Use OpenAI.

Use environment variable:

`OPENAI_API_KEY`

Rules:

* Never expose API key in frontend.
* Never commit `.env`.
* Add `.env` to `.gitignore`.
* All OpenAI calls must happen server-side only.

Add example file:

`.env.example`

Containing:

```env
OPENAI_API_KEY=your_key_here
```

---

## Storage

Preferred simple storage:

`data/responses.json`

If file storage is too slow to implement, use in-memory storage, but prefer JSON file storage for demo reliability.

Implement helper functions:

* `getResponses()`
* `saveResponse(workpack)`
* `generateResponseId()`

Response IDs can be simple:

`R-001`, `R-002`, etc.

---

## Pages / routes

Required:

* `/` — main survey flow
* `/dashboard` — dashboard

Optional:

* `/about` — short explanation
* `/api/followup`
* `/api/summary`
* `/api/responses`

The survey can be a single-page step flow.

---

## Dashboard aggregation

From stored workpacks, compute:

* total responses
* count by `main_theme`
* count by `barrier_or_need`
* list of `suggested_improvement`
* list of response cards

Simple text/cards are enough.

Example dashboard sections:

1. Total responses
2. Main themes
3. Barriers / needs
4. Suggested improvements
5. Response workpacks

---

## Demo fallback

If no real responses exist, show 3 sample demo response cards on dashboard or provide a “Load demo data” button.

Demo themes:

* Too much discussion, not enough building
* Unclear decision process
* Need better technical support
* More inclusive team formation
* Clearer challenge framing

But if real responses exist, show real responses first.

---

## UI requirements

Style should be clean and credible.

Tone:

* civic
* institutional
* calm
* trustworthy
* not playful chatbot branding

Use:

* light background
* dark readable text
* cards
* clear buttons
* visible step indicator

Footer text:

> DeepAsk Live is a hackathon prototype. AI-generated follow-up questions and summaries are draft civic signals for human review, not final institutional conclusions.

---

## Ethical safeguards shown in UI

Display these in a visible but compact way:

* AI asks neutral follow-up questions only.
* AI does not persuade or judge.
* Participant can confirm or edit the summary.
* Original answer is kept separate from AI summary.
* Dashboard shows aggregated civic signals, not personal profiles.
* Do not include sensitive personal information.

---

## What not to build

Do not build:

* login
* full admin system
* real institution workflow
* email notifications
* multi-language support
* advanced charts
* authentication
* moderation system
* personal profiles
* scoring model
* political classification
* emotion detection
* psychological profiling

Do not let AI:

* persuade
* debate
* judge
* infer ideology
* infer protected characteristics
* diagnose
* make policy decisions

---

## Model abstraction

Create a small LLM client wrapper.

Example:

`lib/llmClient.js`

Functions:

* `generateFollowup(answer1)`
* `generateSummary(answer1, followupQuestion, answer2)`

Use OpenAI now, but keep the rest of the app provider-agnostic.

---

## Definition of done

The prototype is done when:

1. A participant can open the survey page.
2. A participant can submit an open first answer.
3. Backend generates one AI follow-up question.
4. Participant can answer the follow-up.
5. Backend generates a structured summary.
6. Participant can confirm or edit the summary.
7. Final response workpack is stored.
8. Dashboard shows submitted responses.
9. Dashboard shows basic aggregation.
10. API key is only used server-side.
11. App can be demoed from survey start to dashboard.

---

## Suggested build order for Codex

1. Set up Next.js project structure.
2. Create survey single-page flow.
3. Add `/api/followup`.
4. Add `/api/summary`.
5. Add JSON file storage.
6. Add final submission endpoint or internal save logic.
7. Build `/dashboard`.
8. Add safeguards text.
9. Add demo data fallback.
10. Polish UI lightly.
11. Test full flow end-to-end.

---

## Pitch explanation to support prototype

Use this wording in app/about page:

DeepAsk Live helps public institutions move beyond shallow surveys. Instead of collecting only ratings or long unstructured text, it starts with the citizen’s own words, asks one neutral AI-generated follow-up question, and creates a citizen-confirmed summary. Each response becomes an auditable workpack where the original voice remains separate from machine interpretation.

DeepAsk does not replace deliberation. It helps institutions listen better before they claim to understand citizens.
