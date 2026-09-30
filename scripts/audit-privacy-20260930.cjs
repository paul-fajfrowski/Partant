// Reproduction des constats de confidentialité du 30 septembre 2026.
// Données fictives en mémoire ; aucune requête réseau ou donnée utilisateur.
// Exit 1 si une donnée est exposée ou conservée. Ce n’est pas un test vert.
const fs = require("node:fs");
const ts = require("../apps/mobile/node_modules/typescript");
require.extensions[".ts"] = (module, file) => module._compile(
  ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText,
  file,
);
const D = require("../apps/mobile/src/product/connectedDomain.ts");
const M = require("../apps/mobile/src/product/model.ts");
const actor = {
  id: "00000000-0000-4000-8000-000000000001",
  email: "audit@example.invalid",
};
const store = D.register(D.emptyConnected(), actor, "Coach Audit", "coach");
store.settings[actor.id] = {
  ...M.configFor(store, actor.id),
  published: true,
  preparation: {
    provided: "", bring: "", weather: "", meeting: "CODE_AUDIT_SYNTHETIQUE",
  },
  locations: {
    studio: {
      type: "Studio", name: "Lieu de test", address: "Adresse publique de test",
      instructions: "CONSIGNE_AUDIT_SYNTHETIQUE",
    },
  },
};
const publicStore = D.project(store);
const result = {
  anonymousPreparationExposed:
    publicStore.settings[actor.id]?.preparation?.meeting === "CODE_AUDIT_SYNTHETIQUE",
  anonymousLocationInstructionsExposed:
    publicStore.settings[actor.id]?.locations?.studio?.instructions === "CONSIGNE_AUDIT_SYNTHETIQUE",
};
store.account = store.identities[0];
store.extraCoaches[0].photoUri = "https://example.invalid/photo-audit";
store.settings[actor.id].business.email = "private@example.invalid";
store.settings[actor.id].studioAddress = "Adresse personnelle de test";
const deleted = D.applyCommand(store, actor, { name: "deleteAccount", args: [] });
result.deletedCoachLocationRetained =
  deleted.settings[actor.id]?.locations?.studio?.instructions === "CONSIGNE_AUDIT_SYNTHETIQUE";
result.deletedCoachPreparationRetained =
  deleted.settings[actor.id]?.preparation?.meeting === "CODE_AUDIT_SYNTHETIQUE";
result.deletedCoachStudioAddressRetained =
  deleted.settings[actor.id]?.studioAddress === "Adresse personnelle de test";
result.deletedCoachExtraProfilePhotoRetained =
  deleted.extraCoaches[0]?.photoUri === "https://example.invalid/photo-audit";
console.log(JSON.stringify(result, null, 2));
if (Object.values(result).some(Boolean)) process.exitCode = 1;
