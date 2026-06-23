const buckets = new Map();

export const LIMITS = {
  maxRequestBytes: 80_000,
  maxAnswerChars: 4000,
  maxSummaryChars: 2500,
  maxQuestionChars: 500,
  maxQuestionsPerSurvey: 12,
  maxResponsesPerSurvey: 1000
};

export function getClientKey(request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  return String(forwardedFor?.split(",")[0] || realIp || "local").trim();
}

export function rateLimit(request, scope, { limit, windowMs }) {
  const key = `${scope}:${getClientKey(request)}`;
  const now = Date.now();
  const bucket = buckets.get(key) || { count: 0, resetAt: now + windowMs };

  if (bucket.resetAt <= now) {
    bucket.count = 0;
    bucket.resetAt = now + windowMs;
  }

  bucket.count += 1;
  buckets.set(key, bucket);

  if (bucket.count > limit) {
    const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    return Response.json(
      { error: "Too many requests. Please wait a moment and try again." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  return null;
}

export async function readLimitedJson(request, maxBytes = LIMITS.maxRequestBytes) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > maxBytes) {
    throw new RequestError("Request is too large", 413);
  }

  const raw = await request.text();
  if (Buffer.byteLength(raw, "utf8") > maxBytes) {
    throw new RequestError("Request is too large", 413);
  }

  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    throw new RequestError("Invalid JSON", 400);
  }
}

export function assertOrganizerCode(request, body = {}) {
  const expected = process.env.ORGANIZER_CODE || process.env.DEEPASK_ORGANIZER_CODE;
  if (!expected) return null;

  const provided =
    request.headers.get("x-organizer-code") ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    body.organizer_code;

  if (provided === expected) return null;

  return Response.json({ error: "Organiser code required" }, { status: 401 });
}

export function truncateText(value, maxChars) {
  return String(value || "").trim().slice(0, maxChars);
}

export function tooSimilarResponses(responses) {
  const participantTexts = responses
    .flatMap((question) => question.turns || [])
    .filter((turn) => turn.role === "participant")
    .map((turn) => normaliseText(turn.text));

  if (participantTexts.length < 2) return false;
  return new Set(participantTexts.filter(Boolean)).size <= 1;
}

export class RequestError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

function normaliseText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}
