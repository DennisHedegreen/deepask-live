# DeepAsk public-data demo

This branch is a short public-data demonstration of DeepAsk's adaptive civic
listening flow.

It asks one required neutral follow-up per main question and lets the participant
choose up to two more, creates a participant-confirmed summary, and turns answers
into a Mind Hive group map. Ten approved synthetic participant workpacks seed the
map and remain labelled separately from answers submitted during the demo.

## Run locally

```bash
npm install
npm run dev
```

Open:

- Entry point: `http://localhost:3000`
- Participant survey: `http://localhost:3000/s/public-data-possibilities`
- Participant group results: `http://localhost:3000/s/public-data-possibilities/mind-hive`
- Participant Help: `http://localhost:3000/help`
- Organiser workspace: `http://localhost:3000/organizer`
- Organiser explanation: `http://localhost:3000/organizer/about`

## Environment

Copy `.env.example` to `.env.local` and add:

```env
LLM_PROVIDER=openai
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4.1-mini
ORGANIZER_CODE=change-this-before-live
NEXT_PUBLIC_BASE_PATH=/deepask
```

Alternative Hugging Face setup:

```env
LLM_PROVIDER=huggingface
HF_TOKEN=your_huggingface_token_here
HF_MODEL=openai/gpt-oss-120b:fastest
```

If no working provider is configured, the app uses question-specific deterministic
fallbacks and records that provider boundary in each follow-up turn.

`ORGANIZER_CODE` protects the organiser workspace and organiser read/write endpoints. Participants can still open and submit surveys without a code.

Set `NEXT_PUBLIC_BASE_PATH=/deepask` when building for
`hedegreenresearch.com/deepask`. Leave it empty for local root development on
`http://localhost:3000`.

For a live Node deployment:

```bash
NEXT_PUBLIC_BASE_PATH=/deepask ORGANIZER_CODE=change-this-before-live npm run build:deepask
NEXT_PUBLIC_BASE_PATH=/deepask ORGANIZER_CODE=change-this-before-live npm run start:deepask
npm run smoke:deepask -- http://127.0.0.1:3100/deepask
npm run smoke:demo-flow -- http://127.0.0.1:3100/deepask
```

More deployment detail is in `deploy/README.md`.

## Deploy on Railway

Use the GitHub repo as the Railway source:

```text
https://github.com/DennisHedegreen/deepask-live
```

Set these Railway variables:

```env
NEXT_PUBLIC_BASE_PATH=/deepask
ORGANIZER_CODE=replace-with-a-real-long-code
LLM_PROVIDER=openai
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4.1-mini
```

Build command:

```bash
npm run build:deepask
```

Start command:

```bash
npm run start:deepask
```

Mount a Railway volume at:

```text
/app/data
```

The public Railway URL will use `/deepask`, for example:

```text
https://your-railway-domain.up.railway.app/deepask
```

Use `/deepask/api/health` as the Railway health-check path.

## Project docs

- `docs/ENGINE.md` explains the survey engine, data model, API routes, Mind Hive rules, and abuse controls.
- `docs/OPERATOR-CARD.md` is the short runbook for demo or live operation.

## Governance principle

Original participant text is stored separately from AI interpretation.

The current prototype uses a `questions[]` workpack format. Each question stores its own conversation turns, follow-up count, and status. The final summary is generated from the answered questions as a whole.

The product is split into separate surfaces:

- Participants use `/s/[surveyId]` and only see the survey, Help page, and aggregated group result.
- Organisers use `/organizer` to create surveys, edit questions, set the follow-up limit, and review operational workpacks.
- Mind Hive uses `/s/[surveyId]/mind-hive` so group results and reactions stay scoped to one survey.

Survey definitions are stored locally in `data/surveys.json`. Response workpacks include `survey_id`, so multiple surveys can run without mixing answers.

## Survey modes

The survey has two participant modes:

- Simple survey: default, low-friction, one question at a time, minimal metadata.
- Research mode: shows the fuller civic-tech flow, safeguards, question state, and interview record.

## Mind Hive

The Mind Hive page is the participant-facing result layer after a survey response is submitted. It turns stored response workpacks into interpreted group patterns. It shows collective statements, agreements, tensions, minority concerns, suggested next questions, and reaction counts on collective statements. It does not show personal public result pages or raw individual answers.

The organiser dashboard is separate and intended for survey operators. It can inspect response workpacks for audit/demo review.
