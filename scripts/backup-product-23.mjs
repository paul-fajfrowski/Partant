// Local business-data backup. Auth identities, Storage binaries and provider secrets are NOT included.
// Usage: node scripts/backup-product-23.mjs [--verify]
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
const root = path.resolve(import.meta.dirname, "..");
const folder = path.join(root, ".local-backups");
fs.mkdirSync(folder, { recursive: true, mode: 0o700 });
fs.chmodSync(folder, 0o700);
function query(file) {
  const r = spawnSync(
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
    { cwd: root, encoding: "utf8", timeout: 60_000 },
  );
  if (r.status !== 0)
    throw Error(
      "Backup query failed; inspect database access without printing private data.",
    );
  return JSON.parse(r.stdout).rows;
}
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "partant-backup-"));
fs.chmodSync(temp, 0o700);
try {
  const sql = path.join(temp, "snapshot.sql");
  fs.writeFileSync(
    sql,
    "select jsonb_build_object('version',(select version from private.product_revision),'documents',(select jsonb_object_agg(key,body) from private.product_documents)) as snapshot;",
    { mode: 0o600 },
  );
  const snapshot = query(sql)[0].snapshot;
  const payload = JSON.stringify(snapshot);
  const digest = createHash("sha256").update(payload).digest("hex");
  const file = path.join(
    folder,
    "product-" + new Date().toISOString().replace(/[:.]/g, "-") + ".json",
  );
  fs.writeFileSync(
    file,
    JSON.stringify({
      format: 1,
      createdAt: new Date().toISOString(),
      sha256: digest,
      snapshot,
    }),
    { mode: 0o600 },
  );
  if (process.argv.includes("--verify")) {
    // Restore the saved payload into an isolated temporary table. No live row or
    // production trigger is touched; this checks product data only, not a full DR.
    const quoted = JSON.stringify(snapshot.documents).replaceAll("'", "''");
    fs.writeFileSync(sql,
      `begin; create temporary table partant_restore_check(key text primary key,body jsonb) on commit drop; insert into partant_restore_check select key,value from jsonb_each('${quoted}'::jsonb); do $$ begin if (select jsonb_object_agg(key,body) from partant_restore_check) is distinct from '${quoted}'::jsonb then raise exception 'RESTORE_MISMATCH'; end if; end $$; rollback;`,
      { mode: 0o600 });
    query(sql);
  }
  console.log(
    JSON.stringify({
      file,
      checksum: digest,
      verifiedInRolledBackTransaction: process.argv.includes("--verify"),
      scope:
        "Product documents only; not Auth, Storage files or provider secrets.",
    }),
  );
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
