// Extra auth variants for F02. All providers and API responses are fixtures.
// This does not send email, validate OAuth consent, or exercise iPhone Keychain.
const { spawnSync } = require("node:child_process");
const path = require("node:path");
const cases = [
  { script: "test-auth-feedback-web", args: ["missing-account"] },
  { script: "test-auth-feedback-web", args: ["success"] },
  { script: "test-email-link-21", args: ["callback"] },
  { script: "test-email-link-21", args: ["resume"] },
  { script: "test-auth-journey-web-19", env: { PARTANT_QA_ROLE: "coach" } },
  ...[390, 1440].flatMap(width => ["client", "coach"].map(role => ({
    script: "test-auth-transition-28",
    env: { PARTANT_QA_WIDTH: String(width), PARTANT_QA_ROLE: role, PARTANT_QA_NEW: "1" },
  }))),
  { script: "test-auth-transition-28", env: { PARTANT_QA_FAILURE: "1" } },
];
for (const c of cases) {
  const result = spawnSync(process.execPath, ["--no-experimental-strip-types", path.join(__dirname, c.script + ".cjs"), ...(c.args || [])], {
    cwd: path.resolve(__dirname, ".."),
    env: { ...process.env, PARTANT_QA_METHOD: "oauth", PARTANT_QA_NEW: "0", PARTANT_QA_FAILURE: "0", PARTANT_QA_ROLE: "client", ...c.env },
    encoding: "utf8", timeout: 18000,
  });
  process.stdout.write(result.stdout || "");
  process.stderr.write(result.stderr || "");
  if (result.error || result.status !== 0) {
    console.error("F02 auth variant failed:", c, result.error?.message);
    process.exit(1);
  }
}
console.log(`PASS ${cases.length} additional F02 auth fixture scenarios.`);
