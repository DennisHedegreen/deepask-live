const requiredBasePath = "/deepask";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
const organizerCode = process.env.ORGANIZER_CODE || process.env.DEEPASK_ORGANIZER_CODE || "";

const failures = [];

if (basePath !== requiredBasePath) {
  failures.push(`NEXT_PUBLIC_BASE_PATH must be ${requiredBasePath}`);
}

if (!organizerCode.trim()) {
  failures.push("ORGANIZER_CODE must be set");
}

if (organizerCode && organizerCode.length < 10) {
  failures.push("ORGANIZER_CODE should be at least 10 characters");
}

if (failures.length) {
  console.error("DeepAsk live preflight failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("DeepAsk live preflight passed.");
console.log(`Base path: ${basePath}`);
console.log("Organiser code: configured");
