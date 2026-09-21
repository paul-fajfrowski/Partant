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

// safe-area-context 5.7.0 initializes C++ fields in a different order from
// React Native 0.86 codegen (top, right, bottom, left). Preserve named values.
const safeAreaFile = path.resolve(
  __dirname,
  "../node_modules/react-native-safe-area-context/ios/Fabric/RNCSafeAreaProviderComponentView.mm",
);
const safeAreaPackage = path.resolve(
  __dirname,
  "../node_modules/react-native-safe-area-context/package.json",
);
if (
  fs.existsSync(safeAreaFile) &&
  require(safeAreaPackage).version === "5.7.0"
) {
  const before = `.top = safeAreaInsets.top,
                .left = safeAreaInsets.left,
                .bottom = safeAreaInsets.bottom,
                .right = safeAreaInsets.right,`;
  const after = `.top = safeAreaInsets.top,
                .right = safeAreaInsets.right,
                .bottom = safeAreaInsets.bottom,
                .left = safeAreaInsets.left,`;
  const source = fs.readFileSync(safeAreaFile, "utf8");
  if (source.includes(before))
    fs.writeFileSync(safeAreaFile, source.replace(before, after));
  else if (!source.includes(after))
    throw Error(
      "Le correctif safe-area-context doit être revérifié : source native inattendue.",
    );
}
