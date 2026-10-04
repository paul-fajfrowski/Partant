// Narrow, reproducible mitigations while upstream versions remain unpatched.
// Fail closed if the installed source changes; never silently skip a patch.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../node_modules');
for (const [name, version] of [['react-native-web','0.21.2'],['braces','3.0.3'],['node-forge','1.4.0']]) {
  if (require(path.join(root,name,'package.json')).version !== version)
    throw Error(`Review mitigation after dependency update: ${name}`);
}
function replace(file, before, after) {
  const target = path.join(root, file), source = fs.readFileSync(target, 'utf8');
  if (source.includes(after)) return;
  if (!source.includes(before)) throw Error(`Review dependency patch: ${file}`);
  fs.writeFileSync(target, source.replaceAll(before, after));
}
// RN Web leaves aria-modal on inactive nested dialogs after dropping their role.
for (const format of ['dist', 'dist/cjs']) {
  replace(`react-native-web/${format}/exports/Modal/ModalContent.js`,
    '"aria-modal": true,', '"aria-modal": active ? true : undefined,');
}
// GHSA-vfj7-8cjw-p6xm: reject excessive parser nesting before recursive walkers.
replace('braces/lib/parse.js', '      stack.push(block);',
  "      if (stack.length >= 128) throw new SyntaxError('Brace nesting exceeds 128 levels');\n      stack.push(block);");
// Also cover callers supplying ASTs directly to public walkers (including cycles).
const guard = `module.exports = function assertDepth(root) {
  const pending = [[root, 0]];
  let visited = 0;
  while (pending.length) {
    const [node, depth] = pending.pop();
    if (depth > 128 || ++visited > 65536) throw new SyntaxError('Brace AST exceeds safe limits');
    if (node && Array.isArray(node.nodes)) {
      for (const child of node.nodes) pending.push([child, depth + 1]);
    }
  }
};\n`;
fs.writeFileSync(path.join(root, 'braces/lib/partant-depth.js'), guard);
for (const name of ['compile', 'expand', 'stringify']) {
  const before = name === 'stringify' ? 'module.exports = (ast, options = {}) => {' : `const ${name} = (ast, options = {}) => {`;
  replace(`braces/lib/${name}.js`, before, before + "\n  require('./partant-depth')(ast);");
}
// GHSA-86w9-cpqp-85rv: ASN.1 validator tolerates extra nested sequence members.
// DigestAlgorithm permits OID, optionally NULL, and no additional elements.
replace('node-forge/lib/rsa.js', '            obj.value.length !== 2) {',
  '            obj.value.length !== 2 ||\n            obj.value[0].value.length < 1 ||\n            obj.value[0].value.length > 2 ||\n            (obj.value[0].value.length === 2 && (!Object.prototype.hasOwnProperty.call(capture, \'parameters\') || capture.parameters !== \'\'))) {');
