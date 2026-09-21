// Optional arguments: absolute APNs .p8 path, Key ID, sandbox|production (default sandbox).
// No private key/token is printed. The existing Apple sign-in key/provider is untouched.
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { randomBytes, createPrivateKey } from "node:crypto";
import { spawnSync } from "node:child_process";
const root = path.resolve(import.meta.dirname, ".."),
  ref = "jhhsysjdeyqsuztjtgea";
const [keyPath, keyId, environment = "sandbox"] = process.argv.slice(2);
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "partant-push-config-"));
fs.chmodSync(temp, 0o700);
const run = (args) => {
  const r = spawnSync("supabase", args, {
    cwd: root,
    encoding: "utf8",
    timeout: 60_000,
  });
  if (r.status !== 0)
    throw Error(
      "Configuration Supabase non confirmée ; vérifier avant de réessayer.",
    );
  return r.stdout;
};
const sql = (query) => {
  const file = path.join(temp, "query.sql");
  fs.writeFileSync(file, query, { mode: 0o600 });
  return JSON.parse(
    run([
      "db",
      "query",
      "--linked",
      "--project-ref",
      ref,
      "--file",
      file,
      "--output",
      "json",
    ]),
  ).rows;
};
try {
  let secret = sql(
    "select decrypted_secret as value from vault.decrypted_secrets where name='partant_push_job'",
  )[0]?.value;
  if (!secret) {
    secret = randomBytes(32).toString("hex");
    sql(`select vault.create_secret('${secret}','partant_push_job')`);
  }
  const values = { PUSH_JOB_SECRET: secret };
  if (keyPath) {
    if (
      !path.isAbsolute(keyPath) ||
      !keyPath.endsWith(".p8") ||
      !/^[A-Z0-9]{10}$/.test(keyId ?? "") ||
      !["sandbox", "production"].includes(environment)
    )
      throw Error(
        "Indiquez le chemin absolu .p8, le Key ID Apple et l’environnement.",
      );
    const pem = fs.readFileSync(keyPath, "utf8");
    const key = createPrivateKey(pem);
    if (
      key.asymmetricKeyType !== "ec" ||
      key.asymmetricKeyDetails?.namedCurve !== "prime256v1"
    )
      throw Error("Clé Apple EC P-256 requise.");
    Object.assign(values, {
      APNS_PRIVATE_KEY_BASE64: Buffer.from(pem).toString("base64"),
      APNS_KEY_ID: keyId,
      APNS_TEAM_ID: "4STLA425HP",
      APNS_ENVIRONMENT: environment,
    });
  }
  const env = path.join(temp, "secrets.env");
  fs.writeFileSync(
    env,
    Object.entries(values)
      .map(([k, v]) => `${k}=${v}`)
      .join("\n") + "\n",
    { mode: 0o600 },
  );
  run(["secrets", "set", "--project-ref", ref, "--env-file", env]);
  sql(
    `select cron.schedule('partant-push-dispatch','* * * * *',$job$select net.http_post(url:='https://${ref}.supabase.co/functions/v1/push-dispatch',headers:=jsonb_build_object('Content-Type','application/json','x-partant-job',(select decrypted_secret from vault.decrypted_secrets where name='partant_push_job')),body:='{}'::jsonb,timeout_milliseconds:=55000);$job$)`,
  );
  const response = await fetch(
    `https://${ref}.supabase.co/functions/v1/push-dispatch`,
    {
      method: "POST",
      headers: { "x-partant-job": secret },
      body: "{}",
      signal: AbortSignal.timeout(60_000),
    },
  );
  if (!response.ok)
    throw Error(
      "Le worker ne répond pas correctement ; sa configuration est enregistrée, la recette reste à terminer.",
    );
  const result = await response.json();
  console.log(
    JSON.stringify({
      scheduled: true,
      configured: result.configured,
      accepted: result.accepted ?? 0,
      environment: keyPath ? environment : "awaiting-APNs-key",
    }),
  );
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
