// Unit tests for store.js (ES module), run in Node: node tools/node-unit.mjs tools/tests/unit.test.js. Same T API as test-harness.js.
// 2026-11-22: omgjord app (version 20) – ärenden med rubrik, beskrivning, deadline, delmål och anteckningar; mallar.
import { defaults, validate, cleanText, exportText, importText, newCase, saveTemplate, progress, openCases, closedCases, dueNow, makeDue, validDue,
  trashCase, restoreCase, purgeTrash, pack, unpack, save, load, loadFull, archReady, tidyNote, VERSION } from '../../store.js';

const mem = new Map();
globalThis.localStorage ??= { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k) };

T.test('defaults: tomt, version 20', () => {
  const d = defaults();
  T.eq([d.version, d.cases, d.tpls, d.people, d.trashDays], [VERSION, [], [], [], 30]);
});
T.test('validering: rubrik krävs, dubbletter och fel datum hoppas över, deadline med eller utan tid', () => {
  const s = validate({ version: 20, people: [{ id: 'p1', name: 'Anna' }], cases: [
    { id: 'a', title: 'Ok', c: '2026-11-10', due: '2026-11-20T09:30', p: 'p1', s: [['Ring', 1], ['', 0], ['Boka', 'x']], l: [['2026-11-11', '  hej  ']] },
    { id: 'a', title: 'Dubblett', c: '2026-11-10' }, { id: 'b', title: '', c: '2026-11-10' }, { id: 'c', title: 'Fel', c: '2026-02-30' },
    { id: 'd', title: 'Dålig deadline', c: '2026-11-10', due: '2026-11-20T25:00', p: 'okänd' }] });
  T.eq(s.cases.map((c) => c.id), ['a', 'd']);
  T.eq(s.cases[0], { id: 'a', title: 'Ok', c: '2026-11-10', u: '2026-11-10', due: '2026-11-20T09:30', p: 'p1', s: [['Ring', 1], ['Boka', 1]], l: [['2026-11-11', 'hej']] });
  T.eq(s.cases[1].due, undefined); T.eq(s.cases[1].p, undefined);
});
T.test('validering: __proto__ som id avvisas, text rensas från styrtecken', () => {
  const s = validate(JSON.parse('{"version":20,"cases":[{"id":"__proto__","title":"x","c":"2026-11-10"},{"id":"ok","title":"A\\u0007B\\u202e","c":"2026-11-10"}]}'));
  T.eq(s.cases.map((c) => [c.id, c.title]), [['ok', 'AB']]);
});
T.test('makeDue och validDue', () => {
  T.eq([makeDue('', '10:00'), makeDue('2026-11-20', ''), makeDue('2026-11-20', '07:05'), makeDue('2026-11-31', ''), makeDue('2026-11-20', '7')], ['', '2026-11-20', '2026-11-20T07:05', false, false]);
  T.ok(validDue('2026-11-20') && validDue('2026-11-20T23:59') && !validDue('2026-11-20T24:00'));
});
T.test('lista: närmast deadline först, utan deadline sist (senast ändrad först)', () => {
  const s = validate({ version: 20, cases: [
    { id: 'n1', title: 'Utan, gammal', c: '2026-11-01', u: '2026-11-01' }, { id: 'n2', title: 'Utan, ny', c: '2026-11-01', u: '2026-11-15' },
    { id: 'd2', title: 'Sen', c: '2026-11-01', due: '2026-12-01' }, { id: 'd1', title: 'Tidig', c: '2026-11-01', due: '2026-11-20T08:00' },
    { id: 'x', title: 'Klar', c: '2026-11-01', due: '2026-11-02', x: '2026-11-03' }] });
  T.eq(openCases(s).map((c) => c.id), ['d1', 'd2', 'n2', 'n1']);
  T.eq(closedCases(s).map((c) => c.id), ['x']);
  T.eq(dueNow(s, '2026-11-20'), 1);
});
T.test('mallar: spara från ärende, samma rubrik ersätts, nytt ärende från mall', () => {
  const s = defaults(), c = newCase(s, 'Boka tandläkare', '2026-11-22');
  c.d = 'Ring 08-123'; c.s = [['Ring', 1], ['Gå dit', 0]]; c.l = [['2026-11-22', 'logg följer inte med']];
  const r = saveTemplate(s, c);
  T.eq([r.replaced, s.tpls.length, s.tpls[0].s], [false, 1, ['Ring', 'Gå dit']]);
  c.s.push(['Betala', 0]);
  T.eq(saveTemplate(s, c).replaced, true); T.eq(s.tpls.length, 1); T.eq(s.tpls[0].s.length, 3);
  const n = newCase(s, '', '2026-11-23', s.tpls[0]);
  T.eq([n.title, n.d, n.s, n.l], ['Boka tandläkare', 'Ring 08-123', [['Ring', 0], ['Gå dit', 0], ['Betala', 0]], undefined]);
  T.eq(newCase(s, 'Egen rubrik', '2026-11-23', s.tpls[0]).title, 'Egen rubrik');
  T.eq(newCase(s, '   ', '2026-11-23'), null, 'rubrik krävs utan mall');
  T.eq(progress(n), [0, 3]);
});
T.test('gamla data (version 14): fält blir beskrivning, slutdatum blir deadline, papperskorgens datum blir del', () => {
  const s = validate({ version: 14, people: [{ id: 'p1', name: 'Nicholas', h: 40, v: { rel: 'Jag' } }],
    types: [{ id: 'task', name: 'Uppgift', end: ['d'], fields: [{ id: 'g', name: 'Mål', kind: 'note' }, { id: 'd', name: 'Klart senast', kind: 'date', due: 1 }] },
      { id: 'house', name: 'Ny bostad', end: ['an'], fields: [{ id: 'ad', name: 'Adress', kind: 'text' }, { id: 'sd', name: 'Ansökt', kind: 'check' }, { id: 'an', name: 'Ansök senast', kind: 'dt', due: 1 }] }],
    cases: [{ id: 'c1', t: 'task', title: 'Fixa markisen', c: '2026-11-22', u: '2026-11-22', p: 'p1', d: 'Sammanfattning', f: { g: 'Kontakta firman', d: '2026-12-01' }, l: [['2026-11-22', 'Ringde']] },
      { id: 'c2', t: 'house', title: 'Spårgatan', c: '2026-11-20', f: { ad: 'Spårgatan 2D', sd: 1, an: '2026-11-25T12:00' }, s: [['Visning', 0, '2026-11-24'], ['Klar', 1]], o: [['Pris', 'num', 9000, '']] },
      { id: 'c3', t: 'okänd', title: 'Utan typ', c: '2026-11-01', s: [['Steg', 0, '2026-11-30']], x: '2026-11-05' }],
    trash: [{ id: 't1', t: 'task', title: 'Borta', c: '2026-11-01', d: '2026-11-21' }] });
  T.eq(s.people, [{ id: 'p1', name: 'Nicholas' }]);
  const [c1, c2, c3] = s.cases;
  T.eq([c1.d, c1.due, c1.p, c1.l], ['Sammanfattning\n\nMål: Kontakta firman', '2026-12-01', 'p1', [['2026-11-22', 'Ringde']]]);
  T.eq([c2.d, c2.due, c2.s], ['Adress: Spårgatan 2D\nAnsökt: Ja\nPris: 9000', '2026-11-25T12:00', [['Visning (2026-11-24)', 0], ['Klar', 1]]]);
  T.eq([c3.title, c3.due, c3.x], ['Utan typ', '2026-11-30', '2026-11-05'], 'okänd typ behålls, deadline från öppet delmål');
  T.eq(s.trash, [{ id: 't1', title: 'Borta', c: '2026-11-01', u: '2026-11-01', del: '2026-11-21' }]);
  T.eq(validate(JSON.parse(JSON.stringify(s))), s, 'ny data ändras inte vid nästa inläsning');
});
T.test('papperskorg: ta bort, återställ, rensa efter trashDays', () => {
  const s = defaults(), c = newCase(s, 'A', '2026-11-01');
  trashCase(s, c, '2026-11-02');
  T.eq([s.cases.length, s.trash[0].del], [0, '2026-11-02']);
  T.eq(restoreCase(s, c.id).del, undefined); T.eq(s.cases.length, 1);
  trashCase(s, s.cases[0], '2026-11-02');
  T.eq(purgeTrash(s, '2026-12-01'), 0); T.eq(purgeTrash(s, '2026-12-02'), 1);
});
T.test('export och import: samma data tillbaka, fel text ger fel', () => {
  const s = validate({ version: 20, people: [{ id: 'p1', name: 'Anna' }], tpls: [{ id: 't1', title: 'Mall', s: ['A'] }],
    cases: [{ id: 'c1', title: 'Ett', c: '2026-11-10', d: 'rad 1\nrad 2', due: '2026-11-12', p: 'p1', s: [['x', 1]], l: [['2026-11-10', 'y']] }] });
  const r = importText(exportText(s, '2026-11-22'));
  T.eq([r.cases, r.skipped, r.exported], [1, 0, '2026-11-22']); T.eq(r.data, s);
  T.ok(importText('{').error); T.ok(importText('{"app":"annat","format":1,"data":{}}').error);
});
T.test('tidyNote och cleanText', () => {
  T.eq(tidyNote('a  \n\n\n\nb\r\n'), 'a\n\nb');
  T.eq(cleanText('x'.repeat(100), 80).length, 80);
});
T.test('pack/unpack', async () => {
  const t = JSON.stringify({ a: 'åäö 😀', n: [1, 2, 3] }).repeat(50);
  T.eq(await unpack(await pack(t)), t);
});
T.test('lagring: gammalt komprimerat arkiv görs om när det läses in', async () => {
  mem.clear();
  const oldRest = { version: 14, arch: 1, types: [{ id: 'task', name: 'Uppgift', end: ['d'], fields: [{ id: 'd', name: 'Klart senast', kind: 'date' }, { id: 'g', name: 'Mål', kind: 'note' }] }],
    cases: [{ id: 'o1', t: 'task', title: 'Öppen', c: '2026-11-01' }], trash: [] };
  const oldArch = [[{ id: 'a1', t: 'task', title: 'Arkiverad', c: '2026-10-01', x: '2026-10-05', f: { d: '2026-10-04', g: 'Klart' } }],
    [{ id: 't1', t: 'task', title: 'Borttagen', c: '2026-10-01', d: '2026-11-20' }]];
  localStorage.setItem('sk.data', JSON.stringify(oldRest)); localStorage.setItem('sk.arch', await pack(JSON.stringify(oldArch)));
  const first = load();
  T.eq([first.cases.map((c) => c.id), archReady()], [['o1'], false]);
  const full = await loadFull(first);
  T.eq(full.cases.map((c) => [c.id, c.due, c.d]), [['o1', undefined, undefined], ['a1', '2026-10-04', 'Mål: Klart']]);
  T.eq(full.trash.map((c) => [c.id, c.del]), [['t1', '2026-11-20']]);
  save(full, true); await new Promise((r) => setTimeout(r, 50));
  T.eq(JSON.parse(localStorage.getItem('sk.data')).version, 20);
  const again = await loadFull(load());
  T.eq(again, full, 'efter sparning läses samma data in igen');
});
