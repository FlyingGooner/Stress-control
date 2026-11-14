// Runs a T-API unit test file (T.test, T.eq, T.ok – same as test-harness.js) in Node. Exit code 1 on any failure.
// Usage: node tools/node-unit.mjs tools/tests/unit.test.js
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const queue = [];
globalThis.T = {
  test: (name, fn) => queue.push([name, fn]),
  eq: (a, b, msg) => assert.deepStrictEqual(a, b, msg),
  ok: (v, msg) => assert.ok(v, msg),
  wait: () => Promise.resolve(),
};
const file = process.argv[2];
if (!file) { console.error('Ange en testfil, t.ex. tools/tests/unit.test.js'); process.exit(2); }
await import(pathToFileURL(resolve(file)).href);
let pass = 0, fail = 0;
for (const [name, fn] of queue) {
  try { await fn(); pass++; } catch (e) { fail++; console.log(`FAIL ${name}\n  ${e.message.split('\n').join('\n  ')}`); }
}
console.log(`${file}: ${pass} ok, ${fail} fel`);
process.exit(fail ? 1 : 0);
