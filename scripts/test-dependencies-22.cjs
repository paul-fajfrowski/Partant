// Validate the Xcode tooling override against the real project, without rewriting it.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { execFileSync } = require("node:child_process");
const { createRequire } = require("node:module");
const mobile = path.resolve(__dirname, "../apps/mobile");
const fromMobile = createRequire(path.join(mobile, "package.json"));
const xcode = fromMobile("xcode");
const fromXcode = createRequire(fromMobile.resolve("xcode"));
assert.equal(fromXcode("uuid/package.json").version, "11.1.1");
const projectFile = path.join(mobile, "ios/Partant.xcodeproj/project.pbxproj");
const project = xcode.project(projectFile).parseSync();
const config = fromMobile("./app.json").expo;
function plistJson(relative) {
  return JSON.parse(
    execFileSync(
      "plutil",
      ["-convert", "json", "-o", "-", path.join(mobile, relative)],
      { encoding: "utf8" },
    ),
  );
}
if (process.platform === "darwin") {
  const info = plistJson("ios/Partant/Info.plist");
  const entitlements = plistJson("ios/Partant/Partant.entitlements");
  assert.equal(info.CFBundleDisplayName, config.name);
  assert.equal(info.CFBundleShortVersionString, config.version);
  assert.equal(
    info.UIUserInterfaceStyle.toLowerCase(),
    config.userInterfaceStyle,
  );
  assert.ok(
    info.CFBundleURLTypes.some((t) =>
      t.CFBundleURLSchemes.includes(config.scheme),
    ),
  );
  assert.deepEqual(entitlements["com.apple.developer.applesignin"], [
    "Default",
  ]);
  const builds = Object.values(project.pbxXCBuildConfigurationSection())
    .filter((v) => v && typeof v === "object")
    .map((v) => v.buildSettings);
  for (const build of builds) {
    assert.equal(build.ENABLE_USER_SCRIPT_SANDBOXING, "NO");
    if (build.PRODUCT_BUNDLE_IDENTIFIER)
      assert.equal(
        build.PRODUCT_BUNDLE_IDENTIFIER,
        config.ios.bundleIdentifier,
      );
    if (build.DEVELOPMENT_TEAM)
      assert.equal(build.DEVELOPMENT_TEAM, config.ios.appleTeamId);
  }
}

const ids = new Set(Array.from({ length: 1000 }, () => project.generateUuid()));
assert.equal(ids.size, 1000);
for (const id of ids) assert.match(id, /^[A-F0-9]{24}$/);
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "partant-dependencies-"));
try {
  const copy = path.join(temp, "project.pbxproj");
  fs.writeFileSync(copy, project.writeSync());
  assert.deepEqual(xcode.project(copy).parseSync().hash, project.hash);
  const safeAreaFile = path.join(
    mobile,
    "node_modules/react-native-safe-area-context/ios/Fabric/RNCSafeAreaProviderComponentView.mm",
  );
  const before = fs.readFileSync(safeAreaFile, "utf8");
  execFileSync(process.execPath, [
    path.join(mobile, "scripts/prepare-ios.cjs"),
  ]);
  assert.equal(
    fs.readFileSync(safeAreaFile, "utf8"),
    before,
    "postinstall must be idempotent",
  );
  // Compile the actual patched initializer against the actual generated member order.
  const header = fs.readFileSync(
    path.join(
      mobile,
      "ios/build/generated/ios/ReactCodegen/react/renderer/components/safeareacontext/EventEmitters.h",
    ),
    "utf8",
  );
  const fields = header.match(
    /struct OnInsetsChangeInsets\s*\{([\s\S]*?)\};/,
  )[1];
  const initializer = before.match(
    /\.top = safeAreaInsets.top,[\s\S]*?\.left = safeAreaInsets.left,/,
  )[0];
  const cpp = path.join(temp, "insets.cpp");
  fs.writeFileSync(
    cpp,
    `#include <cassert>\nstruct Insets {${fields}};\nint main(){ Insets safeAreaInsets{1,2,3,4}; Insets result{${initializer}}; assert(result.top==1 && result.right==2 && result.bottom==3 && result.left==4); }`,
  );
  if (process.platform === "darwin") {
    const executable = path.join(temp, "insets");
    execFileSync("xcrun", [
      "clang++",
      "-std=c++20",
      "-Werror=reorder-init-list",
      cpp,
      "-o",
      executable,
    ]);
    execFileSync(executable);
  }
  console.log(
    "PASS: uuid override, 1000 Xcode IDs, project round trip, idempotent patch, compiled inset values (macOS).",
  );
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
