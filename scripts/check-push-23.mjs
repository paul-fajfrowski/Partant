// Private worker health check. --apns probes Apple's sandbox with an invalid all-zero token.
// It never targets a real device and does not certify delivery on iPhone.
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "partant-push-check-"));
fs.chmodSync(temp, 0o700);
try {
  const file = path.join(temp, "secret.sql");
  fs.writeFileSync(
    file,
    "select decrypted_secret as value from vault.decrypted_secrets where name='partant_push_job'",
    { mode: 0o600 },
  );
  const read = spawnSync(
    "supabase",
    [
      "db",
      "query",
      "--linked",
      "--project-ref",
      "jhhsysjdeyqsuztjtgea",
      "--file",
      file,
      "--output",
      "json",
    ],
    {
      encoding: "utf8",
      cwd: path.resolve(import.meta.dirname, ".."),
      timeout: 60_000,
    },
  );
  if (read.status !== 0) throw Error("Cannot read scheduler configuration.");
  const secret = JSON.parse(read.stdout).rows[0]?.value;
  if (!secret) throw Error("Scheduler not configured.");
  const response = await fetch(
    "https://jhhsysjdeyqsuztjtgea.supabase.co/functions/v1/push-dispatch",
    {
      method: "POST",
      headers: {
        "x-partant-job": secret,
        ...(process.argv.includes("--apns")
          ? { "x-partant-check": "apns" }
          : {}),
      },
      body: "{}",
      signal: AbortSignal.timeout(60_000),
    },
  );
  const result = await response.json();
  console.log(JSON.stringify({ httpStatus: response.status, ...result }));
  if (!response.ok) process.exitCode = 1;
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
