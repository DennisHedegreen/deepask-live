const target = normaliseTarget(process.argv[2] || process.env.DEEPASK_SMOKE_URL || "http://127.0.0.1:3100/deepask");

const checks = [
  {
    name: "root page",
    url: target,
    validate: async (response) => {
      if (!response.ok) return false;
      const html = await response.text();
      return html.includes("Take the survey") &&
        html.includes("Help") &&
        !html.includes(`/s/public-data-possibilities/mind-hive`);
    }
  },
  {
    name: "participant survey",
    url: `${target}/s/public-data-possibilities`,
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
    url: `${target}/api/mind-hive?survey_id=public-data-possibilities`,
    validate: async (response) => {
      if (!response.ok) return false;
      const data = await response.json();
      return Boolean(data.hive?.overview) &&
        Array.isArray(data.hive?.statements) &&
        data.usingDemo === true &&
        data.hive.overview.syntheticResponseCount === 12;
    }
  },
  {
    name: "help page",
    url: `${target}/help`,
    validate: async (response) => {
      if (!response.ok) return false;
      const html = await response.text();
      return html.includes("Start the survey") &&
        !html.includes(`/s/public-data-possibilities/mind-hive`);
    }
  },
  {
    name: "raw responses locked",
    url: `${target}/api/responses?survey_id=public-data-possibilities`,
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
