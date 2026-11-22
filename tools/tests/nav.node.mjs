// Node tests (node:test) for nav.js – the pure Bakåt logic. Run by tools/test.ps1.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { topLayer, layerDepth, closeTop } from '../../nav.js';

test('bakåt: Nytt ärende före ett öppet ärende, papperskorgen underst', () => {
  assert.equal(topLayer({ pick: true, open: 'c1' }), 'pick');
  assert.equal(topLayer({ open: 'c1', trash: true }), 'open');
  assert.equal(topLayer({ trash: true }), 'trash');
  assert.equal(topLayer({}), null);
});
test('bakåt: ett lager i taget, sedan inget mer', () => {
  const S = { pick: false, open: 'c1', trash: true };
  assert.equal(layerDepth(S), 2);
  assert.equal(closeTop(S), true); assert.equal(S.open, null);
  assert.equal(closeTop(S), true); assert.equal(S.trash, false);
  assert.equal(closeTop(S), false, 'dubbeltryck på Bakåt stänger inget mer');
  assert.equal(layerDepth(S), 0);
});
