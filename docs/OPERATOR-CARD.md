# DeepAsk Operator Card

Use this when running the hackathon demo or a small live test.

## Local Demo

```bash
npm install
npm run dev
```

Open:

- Participant survey: `http://localhost:3000/s/hackathon-comet-2026`
- Group result: `http://localhost:3000/s/hackathon-comet-2026/mind-hive`
- Organiser workspace: `http://localhost:3000/organizer`

## Live Build

DeepAsk needs a Node server. It cannot run as only static files.

```bash
NEXT_PUBLIC_BASE_PATH=/deepask ORGANIZER_CODE=change-this-before-live npm run build:deepask
NEXT_PUBLIC_BASE_PATH=/deepask ORGANIZER_CODE=change-this-before-live npm run start:deepask
```

Default production port: `3100`.

## Smoke Test

Local production smoke:

```bash
npm run smoke:deepask -- http://127.0.0.1:3100/deepask
```

Public smoke after reverse proxy:

```bash
npm run smoke:deepask -- https://hedegreenresearch.com/deepask
```

The smoke test checks:

- root page loads
- participant survey loads
- health route loads
- Mind Hive route loads
- organiser response endpoint is locked without a code

## Presentation Flow

1. Open the participant survey.
2. Answer one main question.
3. Answer the automatic neutral follow-up.
4. Continue until the summary appears.
5. Confirm or edit the summary.
6. Review Mind Hive statements one at a time.
7. React to statements that match what the group should pay attention to.
8. Open organiser workspace to show survey setup, aggregate result, Mind Hive, audit, and share tabs.

## Safe Public Settings

Before sharing a public link:

- Set a real `ORGANIZER_CODE`.
- Set `NEXT_PUBLIC_BASE_PATH=/deepask`.
- Run `npm run preflight:live`.
- Run the smoke test.
- Confirm `/api/responses` returns `401` without organiser code.
- Do not ship `.env.local`.

## Data Files

Local data lives in:

- `data/surveys.json`
- `data/responses.json`
- `data/mind-hive-reactions.json`

For a clean public demo, package without old responses:

```bash
npm run package:deepask
```

Clean package:

- `dist-deploy/deepask-live-source.tar.gz`

Demo-data package:

- `dist-deploy/deepask-live-source-with-demo-data.tar.gz`

## Emergency Reset

For a fresh local demo, stop the server and clear only the response/reaction data files. Keep `data/surveys.json`.

Do not delete `.env.local` unless you intend to reconfigure API keys and organiser code.
