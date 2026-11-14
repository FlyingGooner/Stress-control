// Node tests (node:test) for nav.js – the pure Bakåt logic. Run by tools/test.ps1.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { topLayer, layerDepth, closeTop, isDirty } from '../../nav.js';

test('bakåt: typväljare före ärende, typredigerare för sig', () => {
  assert.equal(topLayer({ pick: true, open: 'c1' }), 'pick');
  assert.equal(topLayer({ pick: false, open: 'c1' }), 'open');
  assert.equal(topLayer({ tedit: {} }), 'tedit');
  assert.equal(topLayer({}), null);
  const S = { pick: true, open: null, tedit: null };
  assert.equal(layerDepth(S), 1);
  assert.equal(closeTop(S), true); assert.equal(S.pick, false); assert.equal(closeTop(S), false);
});
test('bakåt: osparad ärendetyp', () => {
  const d = { id: 't', name: 'Hus', fields: [] }, orig = JSON.stringify(d);
  assert.equal(isDirty(structuredClone(d), orig), false);
  assert.equal(isDirty({ ...d, name: 'Hus 2' }, orig), true);
});
