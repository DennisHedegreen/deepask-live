import { mkdir, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";

const root = process.cwd();
const outDir = path.join(root, "dist-deploy");
const includeDemoData = process.argv.includes("--with-demo-data");
const packageName = includeDemoData
  ? "deepask-live-source-with-demo-data.tar.gz"
  : "deepask-live-source.tar.gz";
const packagePath = path.join(outDir, packageName);

await mkdir(outDir, { recursive: true });
await rm(packagePath, { force: true });

const include = [
  "app",
  "components",
  "data/.gitkeep",
  "data/surveys.json",
  "public",
  "deploy",
  "docs",
  "lib",
  "scripts",
  ".dockerignore",
  ".env.example",
  "Dockerfile",
  "README.md",
  "next.config.mjs",
  "package-lock.json",
  "package.json"
];

if (includeDemoData) {
  include.push("data/responses.json", "data/mind-hive-reactions.json");
}

const result = spawnSync(
  "tar",
  [
    "-czf",
    packagePath,
    "--exclude=*.local",
    "--exclude=.env.local",
    "--exclude=node_modules",
    "--exclude=.next",
    ...include
  ],
  {
    cwd: root,
    encoding: "utf8"
  }
);

if (result.status !== 0) {
  console.error(result.stderr || result.stdout || "Could not create deploy package");
  process.exit(result.status || 1);
}

console.log(`Created ${packagePath}`);
console.log(`Demo response data: ${includeDemoData ? "included" : "excluded"}`);
console.log("Upload/extract this on a Node-capable host, then follow deploy/README.md.");
