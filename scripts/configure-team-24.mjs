// Explicit operator action only. No frontend self-enrolment or default administrator.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
const email = process.argv[2]?.trim().toLowerCase();
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
  throw Error(
    "Usage: node scripts/configure-team-24.mjs <email-du-compte-equipe> [--revoke]",
  );
const directory = fs.mkdtempSync(path.join(os.tmpdir(), "partant-team-"));
fs.chmodSync(directory, 0o700);
try {
  const literal = "'" + email.replaceAll("'", "''") + "'";
  const file = path.join(directory, "team.sql");
  const operation = process.argv.includes("--revoke")
    ? "delete from private.product_staff where id=member;"
    : "insert into private.product_staff(id) values(member) on conflict do nothing;";
  fs.writeFileSync(
    file,
    `begin; do $$ declare member uuid; matches integer; begin
 select count(*), (array_agg(id))[1] into matches,member from auth.users where lower(email)=${literal} and email_confirmed_at is not null;
 if matches<>1 then raise exception 'Un compte confirmé unique est requis'; end if;
 if not exists(select 1 from private.product_documents d,jsonb_array_elements(case when d.key='identities' then d.body else '[]'::jsonb end) a where d.key='identities' and a->>'id'=member::text) then raise exception 'Terminez le profil Partant avant habilitation'; end if;
 ${operation}
 end $$; commit;`,
    { mode: 0o600 },
  );
  const result = spawnSync(
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
      cwd: path.resolve(import.meta.dirname, ".."),
      encoding: "utf8",
      timeout: 30000,
    },
  );
  if (result.status !== 0)
    throw Error(
      "Habilitation non appliquée. Vérifiez le compte confirmé, son profil Partant et votre accès administrateur Supabase.",
    );
  console.log(
    process.argv.includes("--revoke")
      ? "Habilitation retirée."
      : "Compte équipe habilité. Actualisez Partant puis ouvrez Espace équipe.",
  );
} finally {
  fs.rmSync(directory, { recursive: true, force: true });
}
