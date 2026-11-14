// Unit tests for store.js (ES module), run in Node by tools/test.ps1 (tools/node-unit.mjs). Same T API as test-harness.js.
import { defaults, validate, cleanText, exportText, importText, newCase, setField, progress, openCases, closedCases, overview, cleanType, DEFAULT_TYPES, changeType } from '../../store.js';

const base = () => validate({ cases: [{ id: 'c1', t: 'sym', title: 'Ont', c: '2026-11-10', u: '2026-11-10', f: { s1: 'Knä', s3: 1 } }] });
T.test('defaults: sex kategorier, fasta typer på och förslag av', () => {
  const d = defaults();
  T.eq(d.cats.map((c) => c.name), ['Hälsa', 'Ekonomi', 'Hem', 'Jobb', 'Relationer', 'Övrigt']);
  T.eq(d.types.filter((t) => t.on).map((t) => t.id), ['sym', 'task', 'job', 'eco', 'home']);
  T.ok(d.types.length >= 13, 'fler förslag i inställningarna');
});
T.test('symptomtypens fält i rätt ordning', () => {
  T.eq(DEFAULT_TYPES[0].fields.map((f) => f.name), ['Symptom', 'Började', 'Kontaktat vården', 'Ringde', 'Tid hos vården', 'Utfall av besök', 'Slutkommentar']);
});
T.test('validering: okänd typ, fel datum och dubbletter hoppas över; fält efter sort', () => {
  const s = validate({ cases: [
    { id: 'a', t: 'sym', title: 'Ok', c: '2026-11-10', f: { s1: 'x', s2: '2026-02-30', s3: true, s4: '2026-11-10T25:00', s5: '2026-11-10T08:30', zz: 'okänt' } },
    { id: 'a', t: 'sym', title: 'Dubblett', c: '2026-11-10' }, { id: 'b', t: 'finns-inte', title: 'x', c: '2026-11-10' }, { id: 'c', t: 'sym', title: '', c: '2026-11-10' }] });
  T.eq(s.cases.length, 1);
  T.eq(s.cases[0].f, { s1: 'x', s3: 1, s5: '2026-11-10T08:30' });
  T.eq(s.cases[0].u, '2026-11-10');
});
T.test('validering: färg utanför listan, okänd kategori, fält-id __proto__ avvisas', () => {
  const s = validate(JSON.parse('{"cats":[{"id":"h","name":"Hälsa","color":"url(x)"}],"types":[{"id":"t","name":"T","cat":"saknas","fields":[{"id":"__proto__","name":"x","kind":"text"},{"id":"a","name":"A","kind":"bad"},{"id":"b","name":"B","kind":"num"}]}]}'));
  T.eq(s.cats, [{ id: 'h', name: 'Hälsa', color: 'gray' }]);
  T.eq(s.types[0].cat, 'h');
  T.eq(s.types[0].fields.map((f) => f.id), ['b']);
});
T.test('nytt ärende får typens förslag på delmål', () => {
  const s = defaults(), c = newCase(s, 'house', 'Villa Ek', '2026-11-14');
  T.eq(c.s.map((x) => x[0]), ['Prata med banken', 'Få lånelöfte', 'Gå på visning', 'Lägg bud']);
  T.eq(progress(c), [0, 4]);
  T.eq(newCase(s, 'house', '   ', '2026-11-14'), null);
});
T.test('fält sätts efter sort: tal med komma, bock, tomt tar bort', () => {
  const s = defaults(), c = newCase(s, 'eco', 'Elräkning', '2026-11-14');
  T.ok(setField(s, c, 'am', '1 250,50', '2026-11-14'));
  T.ok(setField(s, c, 'pd', true, '2026-11-14'));
  T.eq(c.f, { am: 1250.5, pd: 1 });
  T.ok(!setField(s, c, 'am', 'mycket', '2026-11-14'), 'ogiltigt tal');
  T.ok(setField(s, c, 'pd', false, '2026-11-14'));
  T.ok(setField(s, c, 'am', '', '2026-11-14'));
  T.ok(!('f' in c), 'tomma fält sparas inte');
});
T.test('öppna, stängda och överblick', () => {
  const s = base(); s.cases.push({ id: 'c2', t: 'eco', title: 'Klar', c: '2026-11-01', u: '2026-11-02', x: '2026-11-02' });
  T.eq(openCases(s).map((c) => c.id), ['c1']);
  T.eq(closedCases(s).map((c) => c.id), ['c2']);
  const o = overview(s, '2026-11-14');
  T.eq([o.open, o.closed30, o.per.find((x) => x.cat.id === 'h').n], [1, 1, 1]);
});
T.test('egen typ: Hus med bockar', () => {
  const t = cleanType({ id: 'hus', name: 'Hus', icon: '🏡', cat: 'm', on: 1, fields: [{ id: 'f1', name: 'Pratat med banken', kind: 'check' }, { id: 'f2', name: 'Godkänt', kind: 'check' }], steps: ['Ring banken', ''] }, new Set(['m']));
  T.eq(t, { id: 'hus', name: 'Hus', icon: '🏡', cat: 'm', on: 1, fields: [{ id: 'f1', name: 'Pratat med banken', kind: 'check' }, { id: 'f2', name: 'Godkänt', kind: 'check' }], steps: ['Ring banken'] });
});
T.test('text: styr- och riktningstecken tas bort; lång text behåller radbrytning', () => {
  T.eq(cleanText(' a‮b\u0007c '), 'abc');
  T.eq(cleanText('rad1\r\nrad2', 100, true), 'rad1\nrad2');
});
T.test('export → import ger samma data, annan app avvisas', () => {
  const s = base();
  const r = importText(exportText(s, '2026-11-14'));
  T.eq([r.data, r.cases, r.exported], [s, 1, '2026-11-14']);
  T.ok(importText('{"app":"annan","format":1,"data":{}}').error);
  T.ok(importText('inte json').error);
});
T.test('trasig sparad data: kopia bevaras och load() säger till', async () => {
  const mem = { 'sk.data': '{trasig' };
  globalThis.localStorage = { getItem: (k) => mem[k] ?? null, setItem: (k, v) => { mem[k] = String(v); } };
  const st = await import('../../store.js');
  T.eq(st.load().cases, []);
  T.ok(st.loadFailed(), 'loadFailed');
  T.eq(mem['sk.data.broken'], '{trasig');
  T.ok(st.storageUsed() > 0, 'storleken räknas');
});
T.test('byta typ: värden följer med fältnamn, resten hamnar i loggen', () => {
  const s = base(), c = s.cases[0];
  s.types.push({ id: 'x', name: 'X', icon: '📌', cat: 'h', on: 1, fields: [{ id: 'q', name: 'Symptom', kind: 'text' }] });
  T.ok(changeType(s, c, 'x', '2026-11-14'));
  T.eq(c.t, 'x'); T.eq(c.f, { q: 'Knä' });
  T.eq(c.l.at(-1), ['2026-11-14', 'Från Symptom: Kontaktat vården: ja']);
  T.ok(!changeType(s, c, 'finns-inte', '2026-11-14'));
  T.eq(validate(JSON.parse(JSON.stringify(s))).cases[0].f, { q: 'Knä' });
});
