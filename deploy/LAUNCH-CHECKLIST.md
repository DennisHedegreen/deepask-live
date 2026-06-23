# DeepAsk Launch Checklist

## Must Be True Before Public Link

- `ORGANIZER_CODE` is set to a real shared organiser code.
- `NEXT_PUBLIC_BASE_PATH=/deepask`.
- App is running as a Node/Next service, not uploaded as static files.
- Reverse proxy maps `https://hedegreenresearch.com/deepask` to the app.
- `data/` is persistent across restarts/deploys.
- Package choice is deliberate:
  - clean public run: `dist-deploy/deepask-live-source.tar.gz`
  - prefilled demo: `dist-deploy/deepask-live-source-with-demo-data.tar.gz`

## Required Smoke Tests

Preferred:

```bash
npm run smoke:deepask -- https://hedegreenresearch.com/deepask
```

Manual:

```bash
curl -I https://hedegreenresearch.com/deepask
curl https://hedegreenresearch.com/deepask/api/health
curl -I https://hedegreenresearch.com/deepask/s/hackathon-comet-2026
curl https://hedegreenresearch.com/deepask/api/mind-hive?survey_id=hackathon-comet-2026
curl -i https://hedegreenresearch.com/deepask/api/responses?survey_id=hackathon-comet-2026
```

Expected:

- Root returns `200`.
- Health JSON says `ok: true`.
- Health JSON says `basePath: "/deepask"`.
- Health JSON says `organizerCodeConfigured: true`.
- Participant survey returns `200`.
- Mind Hive returns JSON.
- Raw responses returns `401` without organiser code.

## Presentation Link Set

- Public entry: `https://hedegreenresearch.com/deepask`
- Participant survey: `https://hedegreenresearch.com/deepask/s/hackathon-comet-2026`
- Group result: `https://hedegreenresearch.com/deepask/s/hackathon-comet-2026/mind-hive`
- Organiser: `https://hedegreenresearch.com/deepask/organizer`

For the short runbook, see `docs/OPERATOR-CARD.md`.
