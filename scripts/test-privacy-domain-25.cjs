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
const D = require("../apps/mobile/src/product/connectedDomain.ts");
const W = require("../apps/mobile/src/product/workflows.ts");
const P = require("../apps/mobile/src/product/privacyContent.ts");
const actors = ["client", "coach", "staff"].map((x, i) => ({
  id: `00000000-0000-4000-8000-00000000000${i}`,
  email: `${x}@example.test`,
  staff: x === "staff",
}));
let s = D.emptyConnected();
actors.forEach((a, i) => {
  s = D.register(s, a, a.email, i === 1 ? "coach" : "client");
});
const [client, coach, staff] = actors;
let count = 0;
const ok = (v, m) => {
  assert.ok(v, m);
  count++;
};
for (const actor of [client, coach]) {
  for (const kind of P.privacyRequestKinds) {
    s = D.applyCommand(s, actor, {
      name: "report",
      args: [
        {
          kind: `Données personnelles · ${kind}`,
          body: "Demande de test privée",
          owner: staff.id,
          status: "resolved",
        },
      ],
    });
    const ticket = s.tickets.at(-1);
    ok(
      ticket.owner === actor.id && ticket.status === "open",
      "Server fixes owner and status",
    );
    ok(
      D.project(s, actor).tickets.some((t) => t.id === ticket.id),
      "Owner can follow request",
    );
    const other = actor === client ? coach : client;
    ok(
      !D.project(s, other).tickets.some((t) => t.id === ticket.id),
      "Other role cannot see private rights request",
    );
    ok(
      D.project(s, staff).tickets.some((t) => t.id === ticket.id),
      "Authorized team can handle request",
    );
  }
  const exported = W.accountExport(D.project(s, actor));
  ok(
    exported.tickets.every((t) => t.owner === actor.id),
    "Export does not include another account’s requests",
  );
}
ok(!D.project(s).tickets?.length, "Anonymous visitors cannot see requests");
ok(
  P.privacySections(true).some((x) => x.text.includes("justificatifs")),
  "Coach disclosure available",
);
ok(
  P.privacySections(false).some((x) => x.text.includes("profil client")),
  "Client disclosure available",
);
console.log(
  `PASS ${count} privacy request ownership, team access and export checks.`,
);
