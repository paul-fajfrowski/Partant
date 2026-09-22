const fs = require("node:fs"),
  assert = require("node:assert/strict"),
  ts = require("../apps/mobile/node_modules/typescript");
require.extensions[".ts"] = (m, f) =>
  m._compile(
    ts.transpileModule(fs.readFileSync(f, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        esModuleInterop: true,
      },
    }).outputText,
    f,
  );
const D = require("../apps/mobile/src/product/connectedDomain.ts"),
  M = require("../apps/mobile/src/product/model.ts"),
  W = require("../apps/mobile/src/product/workflows.ts"),
  V = require("../apps/mobile/src/product/verification.ts");
const coach = {
    id: "00000000-0000-4000-8000-000000000026",
    email: "coach26@example.test",
  },
  team = {
    id: "00000000-0000-4000-8000-000000000027",
    email: "team26@example.test",
    staff: true,
  },
  other = {
    id: "00000000-0000-4000-8000-000000000028",
    email: "other26@example.test",
  };
let s = D.emptyConnected(),
  checks = 0;
const ok = (v, msg) => {
  assert.ok(v, msg);
  checks++;
};
const rejects = (fn, msg) => {
  assert.throws(fn);
  checks++;
};
const command = (actor, name, ...args) =>
  (s = D.applyCommand(s, actor, { name, args }));
const cfg = () => M.configFor(s, coach.id),
  person = () => M.allCoaches(s).find((c) => c.id === coach.id),
  current = () => V.toVerification(cfg().dossier, person(), M.today());
for (const a of [coach, team, other])
  s = D.register(s, a, a.email, a === coach ? "coach" : "client");
ok(
  !cfg().published && !cfg().dossier.documents.some(Boolean),
  "Registration grants no verification or publication",
);
command(coach, "saveCoach", coach.id, {
  sport: "Running",
  bio: "Accompagnement sportif",
  cert: "Qualification déclarée",
});
const future = M.addDays(M.today(), 365);
const proof = (id, kind, practices = ["Running"]) => ({
  id,
  kind,
  title: V.proofKinds[kind],
  path: `${coach.id}/${id}.pdf`,
  expires: ["card", "insurance", "trainee"].includes(kind) ? future : "",
  practices,
  reference: "",
});
let v = {
  professionalStatus: "qualified",
  context: "",
  practices: ["Running"],
  files: [
    proof("id", "identity"),
    proof("assurance", "insurance"),
    proof("diplome", "qualification"),
    proof("carte", "card"),
  ],
};
command(coach, "saveVerification", coach.id, v, ["Running"]);
ok(
  V.practiceState(current(), "Running", M.today()) === "pending",
  "Complete practice submitted",
);
rejects(
  () =>
    command(
      coach,
      "reviewPractice",
      coach.id,
      "Running",
      "approved",
      "Oui",
      V.proofFingerprint(current(), "Running"),
    ),
  "Coach cannot self approve",
);
rejects(
  () =>
    command(
      { ...coach, staff: true },
      "reviewPractice",
      coach.id,
      "Running",
      "approved",
      "Oui",
      V.proofFingerprint(current(), "Running"),
    ),
  "Staff cannot self approve",
);
rejects(
  () =>
    command(
      team,
      "reviewPractice",
      coach.id,
      "Running",
      "approved",
      "Oui",
      "outdated",
    ),
  "Stale review refused",
);
command(
  team,
  "reviewPractice",
  coach.id,
  "Running",
  "approved",
  "Registre, prérogatives et assurance vérifiés",
  V.proofFingerprint(current(), "Running"),
);
ok(
  V.approvedPractices(cfg().dossier, M.today()).includes("Running"),
  "Human approval authorizes only requested practice",
);
ok(cfg().dossier.history.at(-1).by === team.id, "Reviewer actor recorded");
const active = {
  id: "running",
  coach: coach.id,
  discipline: "Running",
  name: "Séance Running",
  active: true,
  price: 50,
  duration: 60,
  capacity: 1,
  kind: "Individuel",
};
command(coach, "saveOffer", active);
s = {
  ...s,
  settings: { ...s.settings, [coach.id]: { ...cfg(), published: true } },
};
v = current();
v.practices.push("Musculation");
command(coach, "saveVerification", coach.id, v);
ok(
  cfg().published,
  "Adding discipline preserves publication of approved practice",
);
ok(
  V.practiceState(current(), "Musculation", M.today()) === "draft",
  "New practice never inherits global approval",
);
ok(
  V.canOffer(cfg().dossier, person(), active, M.today()),
  "Existing approved offer remains available",
);
ok(
  !V.canOffer(
    cfg().dossier,
    person(),
    { ...active, discipline: "Musculation" },
    M.today(),
  ),
  "New unapproved service cannot be reserved",
);
rejects(
  () =>
    command(coach, "saveVerification", coach.id, current(), ["Musculation"]),
  "Missing scoped qualification prevents submission",
);
v = current();
v.files = v.files.map((f) => ({ ...f, practices: ["Running", "Musculation"] }));
command(coach, "saveVerification", coach.id, v, ["Musculation"]);
ok(
  V.practiceState(current(), "Running", M.today()) === "approved",
  "Reusing document does not invalidate existing scope",
);
command(
  team,
  "reviewPractice",
  coach.id,
  "Musculation",
  "correction",
  "Précisez la portée de la qualification",
  V.proofFingerprint(current(), "Musculation"),
);
ok(
  cfg().published && V.canOffer(cfg().dossier, person(), active, M.today()),
  "Correction on new practice leaves existing bookings open",
);
ok(
  s.notices.at(-1).recipient === coach.id,
  "Decision notifies the owning coach",
);
command(coach, "saveVerification", coach.id, current(), ["Musculation"]);
command(
  team,
  "reviewPractice",
  coach.id,
  "Musculation",
  "approved",
  "Prérogatives confirmées",
  V.proofFingerprint(current(), "Musculation"),
);
command(coach, "saveOffer", {
  ...active,
  id: "muscle",
  discipline: "Musculation",
});
const publicState = D.project(s),
  serialized = JSON.stringify(publicState);
ok(
  !serialized.includes("/diplome.pdf") &&
    !serialized.includes("Prérogatives confirmées"),
  "Public projection excludes files and private decisions",
);
ok(
  publicState.settings[coach.id].dossier.publicPractices.length === 2,
  "Public projection exposes only approved practice names and validity",
);
ok(
  V.canOffer(
    publicState.settings[coach.id].dossier,
    publicState.extraCoaches[0],
    active,
    M.today(),
  ),
  "Public availability works without private files",
);
const forged = structuredClone(current());
forged.reviews.Football = { status: "approved" };
forged.practices.push("Football");
command(coach, "saveVerification", coach.id, forged);
ok(
  V.practiceState(current(), "Football", M.today()) === "draft",
  "Injected review ignored",
);
rejects(
  () =>
    command(coach, "saveSettings", coach.id, {
      ...cfg(),
      dossier: {
        ...cfg().dossier,
        verification: undefined,
        status: "approved",
      },
    }),
  "Legacy endpoint cannot overwrite scoped decisions",
);
rejects(
  () => command(other, "saveVerification", coach.id, current()),
  "Another account cannot edit dossier",
);
v = current();
v.files[0].path = `${other.id}/id.pdf`;
rejects(
  () => command(coach, "saveVerification", coach.id, v),
  "Foreign owner storage path rejected",
);
v = current();
v.files[0].path = `${coach.id}/../id.pdf`;
rejects(
  () => command(coach, "saveVerification", coach.id, v),
  "Path traversal rejected",
);
v = current();
v.files[1].expires = "2027-02-30";
rejects(
  () => command(coach, "saveVerification", coach.id, v),
  "Impossible calendar date rejected",
);
v = current();
v.files.push({ ...v.files[0], id: "duplicate" });
rejects(
  () => command(coach, "saveVerification", coach.id, v),
  "Duplicate upload references rejected",
);
v = current();
v.files[1].expires = "";
rejects(
  () => command(coach, "saveVerification", coach.id, v),
  "Insurance validity required",
);
v = current();
v.files.push(proof("muscle-specific", "supporting", ["Musculation"]));
command(coach, "saveVerification", coach.id, v);
ok(
  V.practiceState(current(), "Musculation", M.today()) === "draft",
  "Changed evidence invalidates affected scope",
);
ok(
  V.practiceState(current(), "Running", M.today()) === "approved",
  "Other practice remains approved",
);
ok(
  !D.project(s).offers.some((o) => o.id === "muscle"),
  "Unapproved offer hidden from discovery",
);
v = current();
v.files[1].path = `${coach.id}/insurance-new.pdf`;
command(coach, "saveVerification", coach.id, v);
ok(
  V.approvedPractices(cfg().dossier, M.today()).length === 0 &&
    !cfg().published,
  "Common proof replacement requires fresh checks for all dependencies",
);
command(coach, "saveVerification", coach.id, current(), ["Running"]);
command(
  team,
  "reviewPractice",
  coach.id,
  "Running",
  "approved",
  "Renouvellement vérifié",
  V.proofFingerprint(current(), "Running"),
);
ok(
  !V.canOffer(cfg().dossier, person(), active, M.addDays(future, 1)),
  "No new booking after document validity ends",
);
const expired = structuredClone(s);
expired.settings[coach.id].dossier.verification.files[1].expires = M.addDays(
  M.today(),
  -1,
);
// Keep decision fingerprint consistent to model natural expiry without edits.
let ev = expired.settings[coach.id].dossier.verification;
ev.reviews.Running.fingerprint = V.proofFingerprint(ev, "Running");
ok(
  V.practiceState(ev, "Running", M.today()) === "expired",
  "Natural expiry reflected per practice",
);
ok(
  !V.canOffer(expired.settings[coach.id].dossier, person(), active, M.today()),
  "Expired qualification blocks only future availability",
);
v = current();
v.practices = ["Running"];
v.files = v.files.map((f) => ({
  ...f,
  practices: f.practices.filter((x) => x === "Running"),
}));
command(coach, "saveVerification", coach.id, v);
ok(
  !current().reviews.Musculation &&
    !V.canOffer(
      cfg().dossier,
      person(),
      { ...active, discipline: "Musculation" },
      M.today(),
    ),
  "Removed activity loses authorization",
);
const trainee = { ...current(), professionalStatus: "trainee" };
ok(
  !V.requirements(trainee, "Running").includes("card") &&
    !V.requirements(trainee, "Running").includes("qualification") &&
    V.requirements(trainee, "Running").includes("trainee"),
  "Trainee uses training attestation, not completed diploma and card",
);
const foreign = { ...current(), professionalStatus: "foreign" };
ok(
  V.requirements(foreign, "Running").includes("recognition"),
  "Foreign qualification gets recognition review",
);
const yoga = { ...current(), practices: ["Yoga"] };
ok(
  V.reviewHint(yoga, "Yoga").includes("cadre applicable"),
  "Yoga routed to individual assessment, no claimed exemption",
);
const legacy = {
  status: "approved",
  expires: future,
  documents: ["id", "qualification", "card", "insurance"],
  reason: "Legacy",
  history: [],
};
const lv = V.toVerification(
  legacy,
  { ...person(), sport: "Running", disciplines: ["Running", "Boxe"] },
  M.today(),
);
ok(
  V.practiceState(lv, "Running", M.today()) === "approved" &&
    V.practiceState(lv, "Boxe", M.today()) === "draft",
  "Migration preserves principal approval without inventing extra scopes",
);
console.log(
  `PASS ${checks} verification, scoped approval, expiry, privacy and authorization checks.`,
);
