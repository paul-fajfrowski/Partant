// Usage: node scripts/configure-google-calendar.mjs /absolute/path/client_secret.json
// Reads the Google download without printing credentials. Supabase CLI login is required.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
const source = process.argv[2];
if (!source || !path.isAbsolute(source))
  throw Error("Indiquez le chemin absolu du fichier JSON OAuth Google.");
const data = JSON.parse(fs.readFileSync(source, "utf8")).web;
if (!data?.client_id || !data.client_secret)
  throw Error("Un client OAuth Application Web est nécessaire.");
const callback =
  "https://jhhsysjdeyqsuztjtgea.supabase.co/functions/v1/google-calendar/callback";
const authOnly = process.argv.includes("--auth-only");
const authCallback =
  "https://jhhsysjdeyqsuztjtgea.supabase.co/auth/v1/callback";
// Google downloads may omit redirect_uris: verify against Google's actual authorization endpoint.
for (const redirect of authOnly ? [authCallback] : [authCallback, callback]) {
  const params = new URLSearchParams({
    client_id: data.client_id,
    redirect_uri: redirect,
    response_type: "code",
    scope: "openid email",
    state: "partant-configuration-check",
  });
  const response = await fetch(
    "https://accounts.google.com/o/oauth2/v2/auth?" + params,
    { signal: AbortSignal.timeout(15000) },
  );
  const body = await response.text();
  if (
    !response.ok ||
    body.includes("redirect_uri_mismatch") ||
    body.includes("invalid_client") ||
    new URL(response.url).pathname.includes("/oauth/error")
  )
    throw Error(
      `Google refuse ce retour : ${redirect}. Ajoutez-le dans le client OAuth Web puis réessayez.`,
    );
}
if (/[\r\n]/.test(data.client_id + data.client_secret))
  throw Error("Identifiants invalides.");
const folder = fs.mkdtempSync(path.join(os.tmpdir(), "partant-google-"));
try {
  if (!authOnly) {
    const file = path.join(folder, "secrets.env");
    fs.writeFileSync(
      file,
      `GOOGLE_CALENDAR_CLIENT_ID=${data.client_id}\nGOOGLE_CALENDAR_CLIENT_SECRET=${data.client_secret}\n`,
      { mode: 0o600 },
    );
    const run = spawnSync(
      "supabase",
      [
        "secrets",
        "set",
        "--project-ref",
        "jhhsysjdeyqsuztjtgea",
        "--env-file",
        file,
      ],
      { stdio: ["ignore", "pipe", "pipe"] },
    );
    if (run.status !== 0)
      throw Error(
        "Import interrompu. Vérifiez votre connexion à Supabase CLI puis réessayez.",
      );
  }
  fs.mkdirSync(path.join(folder, "supabase"));
  fs.writeFileSync(
    path.join(folder, "supabase/config.toml"),
    `project_id = "partant-development"\n[auth.external.google]\nenabled = true\nclient_id = ${JSON.stringify(data.client_id)}\nsecret = ${JSON.stringify(data.client_secret)}\n`,
    { mode: 0o600 },
  );
  const args = ["--project-ref", "jhhsysjdeyqsuztjtgea", "--workdir", folder];
  const diff = spawnSync(
    "supabase",
    ["config", "diff", ...args, "--output-format", "json"],
    { encoding: "utf8" },
  );
  if (diff.status !== 0)
    throw Error(
      "Calendar est configuré. Impossible de vérifier la configuration Auth ; aucune modification Auth appliquée.",
    );
  let review;
  try {
    review = JSON.parse(diff.stdout);
  } catch {
    throw Error("Diff Auth illisible ; aucune modification Auth appliquée.");
  }
  const changes = review.changes ?? review.data?.changes;
  if (
    !Array.isArray(changes) ||
    changes.some(
      (c) =>
        c.declared && c.path?.slice(0, 3).join(".") !== "auth.external.google",
    )
  )
    throw Error("Diff inattendu ; aucune modification Auth appliquée.");
  const push = spawnSync("supabase", ["config", "push", ...args, "--yes"], {
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (push.status !== 0)
    throw Error(
      "Calendar est configuré. Activation Google Auth à vérifier dans Supabase.",
    );
  console.log(
    authOnly
      ? "Connexion Google activée côté serveur. Le consentement réel reste à tester."
      : "Google Calendar et connexion Google configurés côté serveur. Testez maintenant les deux consentements dans Partant.",
  );
} finally {
  fs.rmSync(folder, { recursive: true, force: true });
}
