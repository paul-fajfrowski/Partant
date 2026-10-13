// Exercise the advisory inputs without executing shell commands or expanding huge maps.
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
let checks = 0;
function check(fn) { fn(); checks++; }

const shell = require(path.join(root, 'apps/mobile/node_modules/shell-quote'));
const words = ['echo', 'a b', "l'été", '$(not-executed)'];
check(() => assert.deepEqual(shell.parse(shell.quote(words)), words));
for (const separator of ['\n', '\r', '\u2028', '\u2029']) {
  check(() => assert.throws(
    () => shell.quote(['echo', 'ok', { comment: 'note' }, `value${separator}another-line`]),
    TypeError,
  ));
}

for (const directory of ['apps/mobile', 'tools/qa']) {
  const { SourceMapConsumer } = require(path.join(root, directory, 'node_modules/source-map-js'));
  const flat = { version: 3, sources: ['input.js'], names: [], mappings: 'AAAA' };
  const section = (line, map = flat) => ({
    version: 3,
    sections: [{ offset: { line, column: 0 }, map }],
  });
  check(() => {
    const consumer = new SourceMapConsumer(section(0));
    const mappings = [];
    consumer.eachMapping(mapping => mappings.push(mapping));
    assert.equal(mappings.length, 1);
    assert.equal(mappings[0].source, 'input.js');
    assert.equal(mappings[0].originalLine, 1);
    assert.equal(mappings[0].originalColumn, 0);
  });
  for (const line of [1e12, -1, 0.5]) {
    check(() => assert.throws(() => new SourceMapConsumer(section(line))));
  }
  // Each offset is individually valid; their accumulated offset is excessive.
  check(() => assert.throws(
    () => new SourceMapConsumer(section(6e6, section(6e6))),
  ));
}
console.log(`PASS ${checks} dependency security regressions (shell quoting, indexed source maps)`);
