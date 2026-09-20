// Usage: node scripts/configure-apple-auth.mjs /absolute/path/AuthKey.p8 TEAM_ID KEY_ID SERVICES_ID
// The private key stays local. Only the signed client secret is sent to Supabase Auth.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createPrivateKey, createPublicKey, sign, verify } from "node:crypto";
import { spawnSync } from "node:child_process";

const [source, teamId, keyId, servicesId] = process.argv.slice(2);
if (!source || !path.isAbsolute(source) || !/^[A-Z0-9]{10}$/.test(teamId ?? "") ||
    !/^[A-Z0-9]{10}$/.test(keyId ?? "") || !/^[a-zA-Z0-9.-]+$/.test(servicesId ?? "")) {
  throw Error("Indiquez le chemin absolu .p8, le Team ID, le Key ID et le Services ID.");
}
let key;
try { key = createPrivateKey(fs.readFileSync(source)); }
catch { throw Error("Clé Apple absente ou illisible ; aucune configuration modifiée."); }
if (key.asymmetricKeyType !== "ec" || key.asymmetricKeyDetails?.namedCurve !== "prime256v1")
  throw Error("La clé Apple doit être une clé EC P-256.");
const now = Math.floor(Date.now() / 1000);
const expires = now + 180 * 86400;
const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
const unsigned = `${encode({ alg: "ES256", kid: keyId, typ: "JWT" })}.${encode({
  iss: teamId, iat: now - 60, exp: expires, aud: "https://appleid.apple.com", sub: servicesId,
})}`;
const signature = sign("sha256", Buffer.from(unsigned), { key, dsaEncoding: "ieee-p1363" });
if (signature.length !== 64 || !verify("sha256", Buffer.from(unsigned), {
  key: createPublicKey(key), dsaEncoding: "ieee-p1363",
}, signature)) throw Error("La vérification locale de la signature Apple a échoué.");
const secret = `${unsigned}.${signature.toString("base64url")}`;
const folder = fs.mkdtempSync(path.join(os.tmpdir(), "partant-apple-"));
fs.chmodSync(folder, 0o700);
try {
  fs.mkdirSync(path.join(folder, "supabase"));
  fs.writeFileSync(path.join(folder, "supabase/config.toml"),
    `project_id = "partant-development"\n[auth.external.apple]\nenabled = true\nclient_id = ${JSON.stringify(servicesId + ",com.paulfajfrowski.partant")}\nsecret = ${JSON.stringify(secret)}\n`,
    { mode: 0o600 });
  const args = ["--project-ref", "jhhsysjdeyqsuztjtgea", "--workdir", folder];
  const run = (operation) => spawnSync("supabase", ["config", ...operation, ...args], {
    encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 60000,
  });
  const diff = run(["diff", "--output-format", "json"]);
  if (diff.status !== 0) throw Error("Impossible de lire le diff Supabase ; aucune modification appliquée.");
  let review;
  try { review = JSON.parse(diff.stdout); }
  catch { throw Error("Diff Supabase illisible ; aucune modification appliquée."); }
  const changes = review.changes ?? review.data?.changes;
  if (!Array.isArray(changes) || changes.some((change) => change.declared &&
      change.path?.slice(0, 3).join(".") !== "auth.external.apple"))
    throw Error("Le diff dépasse le fournisseur Apple ; aucune modification appliquée.");
  const push = run(["push", "--yes"]);
  if (push.status !== 0) throw Error("Activation non confirmée : vérifier Supabase avant de réessayer.");
  console.log(JSON.stringify({ provider: "apple", configured: true,
    servicesId, expiresAt: new Date(expires * 1000).toISOString(),
    validation: "Signature locale vérifiée. Consentement et échange Apple réels à tester." }, null, 2));
} finally { fs.rmSync(folder, { recursive: true, force: true }); }
