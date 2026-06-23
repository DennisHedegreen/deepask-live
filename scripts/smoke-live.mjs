const target = normaliseTarget(process.argv[2] || process.env.DEEPASK_SMOKE_URL || "http://127.0.0.1:3100/deepask");

const checks = [
  {
    name: "root page",
    url: target,
    validate: async (response) => response.ok
  },
  {
    name: "participant survey",
    url: `${target}/s/hackathon-comet-2026`,
    validate: async (response) => response.ok
  },
  {
    name: "health",
    url: `${target}/api/health`,
    validate: async (response) => {
      if (!response.ok) return false;
      const data = await response.json();
      return data.ok === true &&
        data.basePath === "/deepask" &&
        data.organizerCodeConfigured === true;
    }
  },
  {
    name: "mind hive",
    url: `${target}/api/mind-hive?survey_id=hackathon-comet-2026`,
    validate: async (response) => {
      if (!response.ok) return false;
      const data = await response.json();
      return Boolean(data.hive?.overview) && Array.isArray(data.hive?.statements);
    }
  },
  {
    name: "raw responses locked",
    url: `${target}/api/responses?survey_id=hackathon-comet-2026`,
    validate: async (response) => response.status === 401
  }
];

let failed = false;

for (const check of checks) {
  try {
    const response = await fetch(check.url, { redirect: "manual" });
    const ok = await check.validate(response.clone());
    if (!ok) {
      failed = true;
      console.error(`FAIL ${check.name}: HTTP ${response.status} ${check.url}`);
    } else {
      console.log(`OK   ${check.name}: HTTP ${response.status}`);
    }
  } catch (error) {
    failed = true;
    console.error(`FAIL ${check.name}: ${error.message}`);
  }
}

if (failed) {
  process.exit(1);
}

console.log(`DeepAsk smoke passed for ${target}`);

function normaliseTarget(value) {
  return String(value || "")
    .trim()
    .replace(/\/+$/g, "");
}
