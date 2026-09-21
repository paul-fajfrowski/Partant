// Usage: node scripts/audit-xcode-warnings-22.cjs /path/to/xcode-log.txt
// Writes only normalized diagnostics, never raw commands/environment from build logs.
const fs = require("node:fs");
const input = process.argv[2];
if (!input) throw Error("Specify the exported Xcode build log.");
const log = fs.readFileSync(input, "utf8");
const unique = new Map();
let occurrences = 0;
function sourcePath(p) {
  if (p.includes("/node_modules/"))
    return p.slice(p.indexOf("/node_modules/") + 1);
  if (p.includes("/XCFrameworkIntermediates/"))
    return "precompiled/" + p.split("/XCFrameworkIntermediates/")[1];
  if (p.includes("/ios/"))
    return "ios/" + p.split("/ios/").slice(1).join("/ios/");
  return p.split("/").pop();
}
function category(m) {
  if (/umbrella header/i.test(m)) return "Headers de frameworks précompilés";
  if (/variable .*was not declared/i.test(m))
    return "Global JavaScript déclaré par le runtime";
  if (/deprecated|deprecat/i.test(m)) return "API obsolète";
  if (/Sendable|concurrency|actor-isolated/i.test(m))
    return "Concurrence Swift";
  if (/nullability|non-null|nonnull|implicitly coerced/i.test(m))
    return "Nullabilité / conversion optionnelle";
  if (/initializer order|reorder-init-list|field designators/i.test(m))
    return "Ordre des initialiseurs C++";
  if (/loses integer precision/i.test(m)) return "Conversion entière";
  if (/switch must be exhaustive/i.test(m))
    return "Énumération SDK à compléter";
  if (/definition|protocol|super|implementation/i.test(m))
    return "Interface / protocole natif";
  if (/variable length/i.test(m)) return "Extension C++";
  return "Autre";
}
for (const match of log.matchAll(
  /^(\/[^\n]+?):(\d+):(\d+): warning: (.+)$/gm,
)) {
  occurrences++;
  const record = {
    path: sourcePath(match[1]),
    line: Number(match[2]),
    column: Number(match[3]),
    message: match[4].trim(),
    category: category(match[4]),
  };
  unique.set(JSON.stringify(record), record);
}
const diagnostics = [...unique.values()].sort(
  (a, b) => a.path.localeCompare(b.path) || a.line - b.line,
);
const byCategory = {};
for (const r of diagnostics)
  byCategory[r.category] = (byCategory[r.category] ?? 0) + 1;
const errors = [
  ...log.matchAll(/^(?:\/[^\n]+?:\d+(?::\d+)?: )?(?:fatal )?error: .+$/gm),
].length;
console.log(
  JSON.stringify(
    {
      scope:
        "Compiler file:line:column warnings only; repeated identical diagnostics deduplicated after path normalization. Not a build result or unique bug count.",
      occurrences,
      uniqueDiagnostics: diagnostics.length,
      compilerErrors: errors,
      buildSucceededMarker: log.includes("** BUILD SUCCEEDED **"),
      byCategory,
      diagnostics,
    },
    null,
    2,
  ),
);
