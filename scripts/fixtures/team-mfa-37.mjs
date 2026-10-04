// Isolated test identities only. Secrets never leave the private temporary fixture.
import fs from "node:fs";
import { createHmac } from "node:crypto";
export function totp(secret, time = Date.now()) {
  let bits = "";
  for (const c of secret.toUpperCase().replace(/=+$/, "")) {
    const i = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567".indexOf(c);
    if (i < 0) throw Error("Invalid test secret");
    bits += i.toString(2).padStart(5, "0");
  }
  const bytes = Buffer.from(bits.match(/.{8}/g).map((s) => parseInt(s, 2)));
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(time / 30000)));
  const hash = createHmac("sha1", bytes).update(counter).digest(),
    offset = hash[19] & 15;
  return ((hash.readUInt32BE(offset) & 0x7fffffff) % 1000000)
    .toString()
    .padStart(6, "0");
}
export async function elevateQaTeam(u, base, apikey) {
  if (
    !u.email.startsWith("partant-qa-") ||
    !u.email.endsWith("@example.invalid")
  )
    throw Error("MFA test helper refuses real accounts");
  const file = "/private/tmp/partant-mfa-37.json";
  let saved = {};
  if (fs.existsSync(file)) saved = JSON.parse(fs.readFileSync(file, "utf8"));
  async function call(path, body) {
    const r = await fetch(base + "/auth/v1/" + path, {
      method: "POST",
      headers: {
        apikey,
        Authorization: "Bearer " + u.token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const d = await r.json();
    if (!r.ok)
      throw Error("QA MFA " + r.status + " " + (d.error_code ?? d.code ?? ""));
    return d;
  }
  let f = saved[u.id];
  if (!f) {
    const d = await call("factors", {
      factor_type: "totp",
      friendly_name: "QA Partant",
    });
    f = { id: d.id, secret: d.totp.secret };
    saved[u.id] = f;
    fs.writeFileSync(file, JSON.stringify(saved), { mode: 0o600 });
  }
  // Auth rejects reusing a verified time step.
  if (f.last && Math.floor(Date.now() / 30000) <= f.last)
    await new Promise((r) => setTimeout(r, 30000 - (Date.now() % 30000) + 100));
  const challenge = await call(`factors/${f.id}/challenge`, {}),
    d = await call(`factors/${f.id}/verify`, {
      challenge_id: challenge.id,
      code: totp(f.secret),
    });
  f.last = Math.floor(Date.now() / 30000);
  fs.writeFileSync(file, JSON.stringify(saved), { mode: 0o600 });
  return d.access_token;
}
