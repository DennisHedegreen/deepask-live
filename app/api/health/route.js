export async function GET() {
  return Response.json({
    ok: true,
    app: "deepask-live",
    basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
    organizerCodeConfigured: Boolean(
      process.env.ORGANIZER_CODE || process.env.DEEPASK_ORGANIZER_CODE
    ),
    timestamp: new Date().toISOString()
  });
}
