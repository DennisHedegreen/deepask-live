# DeepAsk Engine

DeepAsk Live is split into two product surfaces:

- Participant surface: `/s/[surveyId]`, `/s/[surveyId]/about`, and `/s/[surveyId]/mind-hive`.
- Organiser surface: `/organizer` and `/organizer/about`.

The participant surface is for answering a survey and reacting to collective group statements. It does not expose raw answers from other people. The organiser surface is for creating surveys, editing questions, inspecting workpacks, and reviewing aggregate results.

## Survey Engine

Each survey is a configurable workpack stored in `data/surveys.json`.

Important survey fields:

- `id`: public survey identifier used in `/s/[surveyId]`.
- `title`: participant-facing survey name.
- `subtitle`: short context label.
- `intro`: participant-facing explanation.
- `mode`: default survey mode, usually `simple`.
- `followup_limit`: maximum follow-up questions per main question, clamped to 1–3.
- `questions[]`: ordered civic questions.
- `status`: whether the survey is active.

The participant flow is intentionally one question at a time.

For each main question:

1. Participant answers the main question.
2. DeepAsk generates one required neutral follow-up.
3. Participant answers that follow-up.
4. The participant may request another neutral follow-up, up to three in total,
   or move to the next main question.

This invariant matters because the product promise is not just a form. Every submitted answer should include at least one clarification pass before it becomes part of the group map.

## Participant State Machine

The UI moves through these stages:

- `answer`: participant answers the current main question.
- `decision`: the system has produced a neutral follow-up and waits for the follow-up answer.
- `summary`: the participant sees a generated summary and can confirm or edit it.
- `saved`: the response workpack has been stored.
- `groupReview`: the participant reviews Mind Hive statements one at a time and can react to them.

Simple mode hides most operational detail. Research mode shows more of the interview structure and civic-tech safeguards.

## Response Workpacks

Responses are stored as JSON workpacks under `data/responses.json`.

A response contains:

- `response_id`: generated server-side.
- `survey_id`: links the response to a survey.
- `questions[]`: answers, follow-ups, and per-question status.
- `summary`: participant-confirmed summary.
- `metadata`: operational metadata for audit and demo use.

Raw participant answers are not shown on the public Mind Hive page. They are used only to produce aggregate patterns.

## AI and Fallback Logic

If an AI provider is configured, DeepAsk uses it to generate neutral follow-up questions and summaries.

Supported provider settings:

- `LLM_PROVIDER=openai`
- `LLM_PROVIDER=huggingface`

If no provider works, the app uses question-specific deterministic fallback logic
and records `local-fallback` in the turn metadata. This keeps the demo usable
without presenting the fallback as a successful external model call.

The AI role is constrained:

- Ask neutral follow-up questions.
- Summarise what the participant said.
- Avoid persuasion, scoring, judgement, or policy decisions.

## Mind Hive

Mind Hive is the collective result layer. It answers:

`What is the group thinking?`

It does not answer:

`What did one person answer?`

Mind Hive reads submitted workpacks for one survey and turns them into interpreted group patterns:

- recurring themes
- agreements
- disagreements
- minority concerns
- collective statements
- suggested next questions
- participant reactions to collective statements

The demo seed statements were produced in a separate collective-analysis pass over
the ten participant-approved synthetic workpacks. Each persisted pattern carries
the synthetic response IDs that support it. New submitted responses can join a
pattern through its documented keyword lens, while the public layer still exposes
only counts and collective statements rather than raw answers.

The analysis deliberately excludes organiser questions and AI follow-up prompts as
evidence. Participant turns and participant-approved summaries are the source text,
and one response can count at most once toward a statement.

Mind Hive filters incomplete legacy responses so group statements are based on responses that include the required follow-up structure.

## Reactions

Participants react to collective statements, not to individual people.

Available reactions:

- Agree
- Important
- Concern
- Needs discussion
- Missing perspective

Reaction counts are stored per survey and statement in `data/mind-hive-reactions.json`.

The browser stores local reaction state to discourage repeat reactions from the same browser. Server-side validation checks survey id, statement id, and reaction type.

## API Routes

Public participant routes:

- `GET /api/surveys/[surveyId]`: load public survey configuration.
- `POST /api/followup`: generate a neutral follow-up.
- `POST /api/summary`: generate a participant summary.
- `POST /api/responses`: submit a response workpack.
- `GET /api/mind-hive?survey_id=[surveyId]`: load public group patterns.
- `POST /api/mind-hive/reactions`: add a statement reaction.
- `GET /api/health`: deployment health check.

Organiser-protected routes:

- `GET /api/responses`: inspect submitted workpacks.
- `POST /api/surveys`: create a survey.
- `PUT /api/surveys/[surveyId]`: update survey configuration.
- `POST /api/organizer/auth`: validate organiser code.

Organiser routes require `ORGANIZER_CODE`.

## Storage and Write Safety

The MVP uses local JSON storage under `data/`.

Important files:

- `data/surveys.json`
- `data/responses.json`
- `data/mind-hive-reactions.json`

Writes are serialized and atomic so concurrent local writes do not easily corrupt JSON files. Response ids are assigned inside the write lock to avoid duplicate ids during near-simultaneous submissions.

## Abuse Controls

The MVP includes pragmatic anti-abuse controls:

- request size limits
- per-route rate limits
- maximum participant text lengths
- maximum responses per survey
- validated reaction types
- organiser code for organiser data access

This is enough for a hackathon prototype and low-risk public demo. It is not a full production abuse platform.

## Deployment Boundary

DeepAsk is not a static site. It needs a running Next.js server because it uses API routes and local JSON writes.

For `hedegreenresearch.com/deepask`, use:

- `NEXT_PUBLIC_BASE_PATH=/deepask`
- `ORGANIZER_CODE=...`
- a Node server or Docker container
- a reverse proxy from `/deepask` to the Next server

The existing static Hedegreen Research upload path alone is not enough.

## Known Limits

- Local JSON storage is acceptable for demo use, not heavy public traffic.
- LocalStorage reaction dedupe is soft protection, not identity.
- Rule-based Mind Hive statements are deterministic MVP patterns, not final civic analysis.
- There is no user account system by design.
- Organiser code is a simple shared gate, not role-based access control.
