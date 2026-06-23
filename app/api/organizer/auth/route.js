import { assertOrganizerCode, readLimitedJson } from "@/lib/security";

export async function POST(request) {
  try {
    const body = await readLimitedJson(request, 10_000);
    const code = String(body.organizer_code || "").trim();
    if (!code) {
      return Response.json({ error: "Organiser code required" }, { status: 400 });
    }

    const authError = assertOrganizerCode(request, body);
    if (authError) return authError;

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { error: error.message || "Could not validate organiser code" },
      { status: error.status || 500 }
    );
  }
}
