// Keep Expo's disposable build products outside Documents/iCloud. No source relocation.
const fs = require("node:fs");
const path = require("node:path");
const file = path.resolve(
  __dirname,
  "../node_modules/expo-modules-jsi/apple/scripts/build-xcframework.sh",
);
const original = 'DERIVED_DATA_PATH="${PACKAGE_DIR}/.DerivedData"';
const patched =
  'DERIVED_DATA_PATH="${HOME}/Library/Caches/Partant-ExpoModulesJSI"';
if (process.platform === "darwin" && fs.existsSync(file)) {
  const source = fs.readFileSync(file, "utf8");
  if (source.includes(original))
    fs.writeFileSync(file, source.replace(original, patched));
  else if (!source.includes(patched))
    throw Error(
      "Le script Expo a changé : vérifier le correctif du cache iOS avant de compiler.",
    );
}
