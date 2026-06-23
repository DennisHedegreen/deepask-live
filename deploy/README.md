# DeepAsk Live Deployment

DeepAsk is not a static site. It needs a running Next.js server because it uses
API routes for:

- AI follow-up generation
- summary generation
- survey response storage
- Mind Hive reaction counts
- organiser survey editing

The normal Hedegreen Research FTP/static upload path is not enough for this app.
Deploy it as a Node service and route `https://hedegreenresearch.com/deepask`
to that service with a reverse proxy.

## Required Environment

Set these on the server:

```env
NODE_ENV=production
NEXT_PUBLIC_BASE_PATH=/deepask
ORGANIZER_CODE=replace-with-real-code

# Optional live AI provider
LLM_PROVIDER=openai
OPENAI_API_KEY=replace-with-real-key
OPENAI_MODEL=gpt-4.1-mini

# Alternative
# LLM_PROVIDER=huggingface
# HF_TOKEN=replace-with-real-token
# HF_MODEL=openai/gpt-oss-120b:fastest
```

Without a working AI provider, DeepAsk still runs with deterministic demo
fallbacks.

## Build

```bash
npm install
NEXT_PUBLIC_BASE_PATH=/deepask ORGANIZER_CODE=replace-with-real-code npm run build:deepask
```

## Package For Server Transfer

From the project root:

```bash
npm run package:deepask
```

This creates:

```text
dist-deploy/deepask-live-source.tar.gz
```

The package excludes local secrets, `node_modules`, `.next`, and local-only env
files. It also excludes stored responses and reaction counts by default. Extract
it on a Node-capable host, set the required environment variables, then run the
build/start commands above.

For a hackathon demo where existing local group data should be included:

```bash
npm run package:deepask -- --with-demo-data
```

This creates a separate file:

```text
dist-deploy/deepask-live-source-with-demo-data.tar.gz
```

Use the demo-data package only when the presentation needs a prefilled Mind Hive.
Use the standard package for a clean public run.

## Run

```bash
NEXT_PUBLIC_BASE_PATH=/deepask ORGANIZER_CODE=replace-with-real-code npm run start:deepask
```

Then proxy:

```text
https://hedegreenresearch.com/deepask -> http://127.0.0.1:3100/deepask
```

## Docker Option

From the project root:

```bash
docker build -t deepask-live .
docker run -d \
  --name deepask-live \
  --restart unless-stopped \
  -p 127.0.0.1:3100:3100 \
  -e NEXT_PUBLIC_BASE_PATH=/deepask \
  -e ORGANIZER_CODE=replace-with-real-code \
  -e LLM_PROVIDER=openai \
  -e OPENAI_API_KEY=replace-with-real-key \
  -e OPENAI_MODEL=gpt-4.1-mini \
  -v deepask-data:/app/data \
  deepask-live
```

Or adapt `deploy/docker-compose.example.yml`.

## Smoke Tests

After starting the production app:

```bash
npm run smoke:deepask -- http://127.0.0.1:3100/deepask
```

Manual equivalent:

```bash
curl -I http://127.0.0.1:3100/deepask
curl http://127.0.0.1:3100/deepask/api/health
curl -I http://127.0.0.1:3100/deepask/s/hackathon-comet-2026
curl http://127.0.0.1:3100/deepask/api/mind-hive?survey_id=hackathon-comet-2026
curl -i http://127.0.0.1:3100/deepask/api/responses?survey_id=hackathon-comet-2026
```

Expected:

- `/deepask` returns 200
- health returns `ok: true` and `organizerCodeConfigured: true`
- participant survey returns 200
- Mind Hive API returns JSON
- raw responses endpoint returns 401 without organiser code

With organiser code:

```bash
curl -i \
  -H "x-organizer-code: replace-with-real-code" \
  http://127.0.0.1:3100/deepask/api/responses?survey_id=hackathon-comet-2026
```

Expected: 200.
