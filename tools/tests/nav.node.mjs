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
test('bakåt: öppet ärende stängs, sedan inget mer', () => {
  const S = { pick: false, open: 'c1', tedit: null };
  assert.equal(layerDepth(S), 1);
  assert.equal(closeTop(S), true); assert.equal(S.open, null);
  assert.equal(closeTop(S), false, 'dubbeltryck på Bakåt stänger inget mer');
});
test('bakåt: typväljaren släpper utkastet till nytt ärende', () => {
  const S = { pick: true, draft: { t: 'sym', f: { s1: 'Knä' } }, open: null, tedit: null };
  closeTop(S);
  assert.equal(S.pick, false); assert.equal(S.draft, null);
});
test('bakåt: typredigerare med osparade ändringar räknas som ändrad', () => {
  const d = { id: 't', name: 'Hus', fields: [{ id: 'f1', name: 'A', kind: 'text' }] }, orig = JSON.stringify(d);
  const S = { tedit: { ...d, fields: [...d.fields, { id: 'f2', name: '', kind: 'text' }] }, teditOrig: orig };
  assert.equal(topLayer(S), 'tedit');
  assert.equal(isDirty(S.tedit, S.teditOrig), true);
  assert.equal(isDirty(null, orig), false);
});

test('typeditor från ett ärende ligger överst och Bakåt stänger bara den', () => {
  const S = { pick: false, open: 'c1', tedit: { id: 't1' }, teditFor: 'c1' };
  assert.equal(topLayer(S), 'tedit'); assert.equal(layerDepth(S), 2);
  closeTop(S); assert.equal(S.open, 'c1'); assert.equal(S.tedit, null); assert.equal(S.teditFor, null);
});

test('delmålslistan är ett lager; ett ärende öppnat från den ligger överst', () => {
  const S = { steps: true, open: 'c1' };
  assert.equal(topLayer(S), 'open'); assert.equal(layerDepth(S), 2);
  closeTop(S); assert.equal(topLayer(S), 'steps'); closeTop(S); assert.equal(topLayer(S), null);
});
test('bakåt: papperskorgen är ett lager', () => {
  const S = { trash: true };
  assert.equal(topLayer(S), 'trash'); assert.equal(layerDepth(S), 1);
  assert.equal(closeTop(S), true); assert.equal(S.trash, false); assert.equal(closeTop(S), false);
});

test('bakåt: redigering ligger över visningen av ett ärende', () => {
  const S = { open: 'c1', edit: true };
  assert.equal(topLayer(S), 'edit'); assert.equal(layerDepth(S), 2);
  closeTop(S); assert.equal(S.edit, false); assert.equal(topLayer(S), 'open');
  closeTop(S); assert.equal(S.open, null); assert.equal(closeTop(S), false);
  assert.equal(layerDepth({ open: null, edit: true }), 0, 'kvarglömd edit utan ärende räknas inte');
});
