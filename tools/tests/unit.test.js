// Unit tests for store.js (ES module), run in Node by tools/test.ps1 (tools/node-unit.mjs). Same T API as test-harness.js.
import { defaults, validate, cleanText, exportText, importText, newCase, setField, progress, openCases, closedCases, overview, cleanType, DEFAULT_TYPES, changeType, typeChangeLoss, addExtra, setExtra, alerts, nextCase, firstDate, addMonths, trashCase, restoreCase, purgeTrash, pack, unpack, save, load, loadFull, trashArchivedBefore, archReady, setStepDone, setStepRepeat, splitItems, stepOrder, sortCases, sortOf, nextSort } from '../../store.js';

const base = () => validate({ cases: [{ id: 'c1', t: 'sym', title: 'Ont', c: '2026-11-10', u: '2026-11-10', f: { s1: 'Knä', s3: 1 } }] });
T.test('defaults: sex kategorier, fasta typer på och förslag av', () => {
  const d = defaults();
  T.eq(d.cats.map((c) => c.name), ['Hälsa', 'Ekonomi', 'Hem', 'Jobb', 'Relationer', 'Handla', 'Övrigt']);
  T.eq(d.types.filter((t) => t.on).map((t) => t.id), ['sym', 'task', 'job', 'eco', 'home', 'shop', 'fk']);
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
  T.eq(s.cats, [{ id: 'h', name: 'Hälsa', color: 'gray' }, { id: 's', name: 'Handla', color: 'teal' }], 'gammal data utan version får Handla');
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
T.test('byta typ: värden följer med fältnamn, resten sparas synligt och kommer tillbaka', () => {
  const s = base(), c = s.cases[0];
  s.types.push({ id: 'x', name: 'X', icon: '📌', cat: 'h', on: 1, fields: [{ id: 'q', name: 'Symptom', kind: 'text' }] });
  T.eq(typeChangeLoss(s, c, 'x').map((x) => x.n), ['Kontaktat vården']);
  T.ok(changeType(s, c, 'x', '2026-11-14'));
  T.eq(c.t, 'x'); T.eq(c.f, { q: 'Knä' }); T.eq(c.o, [['Kontaktat vården', 'check', 1, 'Symptom']]); T.ok(!c.l);
  T.eq(validate(JSON.parse(JSON.stringify(s))).cases[0].o, c.o);
  T.ok(changeType(s, c, 'sym', '2026-11-14'));
  T.eq(c.f, { s1: 'Knä', s3: 1 }); T.ok(!c.o, 'tillbaka i fälten');
  T.ok(!changeType(s, c, 'finns-inte', '2026-11-14'));
});
T.test('byta typ med rensa: nya restvärden tas bort, äldre ligger kvar', () => {
  const s = base(), c = s.cases[0];
  s.types.push({ id: 'x', name: 'X', icon: '📌', cat: 'h', on: 1, fields: [] });
  changeType(s, c, 'x', '2026-11-14', true);
  T.ok(!c.f && !c.o);
  const v = validate({ ...s, cases: [{ ...c, o: [['A', 'text', 'v', 'T'], ['B', '__proto__', 'v', 'T'], ['C', 'num', 'x', 'T']] }] });
  T.eq(v.cases[0].o, [['A', 'text', 'v', 'T'], ['C', 'num', null, 'T']]);
});
T.test('extra fält i ett ärende: lägg till, fyll i, tomt värde behålls, följer med till typ med samma fält', () => {
  const s = base(), c = s.cases[0];
  T.ok(addExtra(c, 'Pris', 'num', '2026-11-14')); T.ok(!addExtra(c, 'Pris', 'text', '2026-11-14'), 'dubblett'); T.ok(!addExtra(c, ' ', 'text', '2026-11-14'));
  T.ok(addExtra(c, 'Not', 'text', '2026-11-14'));
  T.ok(!setExtra(c, 0, 'abc', '2026-11-14')); T.ok(setExtra(c, 0, '1 250,5', '2026-11-14'));
  T.eq(c.o, [['Pris', 'num', 1250.5, ''], ['Not', 'text', null, '']]);
  T.eq(validate(JSON.parse(JSON.stringify(s))).cases[0].o, c.o);
  s.types.push({ id: 'y', name: 'Y', icon: '📌', cat: 'h', on: 1, fields: [{ id: 'p', name: 'Pris', kind: 'num' }, { id: 'n', name: 'Not', kind: 'text' }, { id: 'a', name: 'Symptom', kind: 'text' }] });
  changeType(s, c, 'y', '2026-11-14');
  T.eq(c.f, { p: 1250.5, a: 'Knä' }); T.eq(c.o, [['Kontaktat vården', 'check', 1, 'Symptom']]);
});
T.test('aktuellt: datum inom påminnelsetiden, passerade deadlines, inte stängda', () => {
  const s = defaults();
  s.cases = [
    { id: 'a', t: 'task', title: 'Snart', c: '2026-11-01', u: '2026-11-01', f: { d: '2026-11-18' } },
    { id: 'b', t: 'task', title: 'Sen', c: '2026-11-01', u: '2026-11-01', f: { d: '2026-11-10' } },
    { id: 'c', t: 'task', title: 'Långt bort', c: '2026-11-01', u: '2026-11-01', f: { d: '2026-12-30' } },
    { id: 'd', t: 'sym', title: 'Började förr', c: '2026-11-01', u: '2026-11-01', f: { s2: '2026-11-01', s5: '2026-11-14T09:00' } },
    { id: 'e', t: 'task', title: 'Stängd', c: '2026-11-01', u: '2026-11-01', x: '2026-11-02', f: { d: '2026-11-15' } },
    { id: 'f', t: 'task', title: 'Extra', c: '2026-11-01', u: '2026-11-01', o: [['Service', 'date', '2026-11-20', '']] }];
  const a = alerts(s, '2026-11-14');
  T.eq(a.map((x) => [x.c.id, x.days, x.late]), [['b', -4, true], ['d', 0, false], ['a', 4, false], ['f', 6, false]]);
  s.alertDays = 1; T.eq(alerts(s, '2026-11-14').map((x) => x.c.id), ['b', 'd']);
});
T.test('version 1-data får deadline på standardfälten; alertDays valideras', () => {
  const v1 = validate({ version: 1, types: [{ id: 'task', name: 'Uppgift', cat: 'o', on: 1, fields: [{ id: 'g', name: 'Mål', kind: 'note' }, { id: 'd', name: 'Klart senast', kind: 'date' }] }], alertDays: 5 });
  T.eq(v1.types[0].fields[1].due, 1); T.ok(!v1.types[0].fields[0].due); T.eq(v1.alertDays, 7);
  const v2 = validate({ version: 2, types: [{ id: 'task', name: 'Uppgift', cat: 'o', on: 1, fields: [{ id: 'd', name: 'Klart senast', kind: 'date' }] }], alertDays: 14 });
  T.ok(!v2.types[0].fields[0].due, 'avbockad deadline respekteras'); T.eq(v2.alertDays, 14);
});
T.test('delmål med datum: valideras och syns i Aktuellt tills det bockas av', () => {
  const s = defaults();
  s.cases = [{ id: 'a', t: 'task', title: 'Bil', c: '2026-11-01', u: '2026-11-01', s: [['Boka service', 0, '2026-11-16'], ['Klart', 1, '2026-11-15'], ['Utan datum', 0]] }];
  T.eq(alerts(s, '2026-11-14').map((x) => [x.name, x.days]), [['Delmål Boka service', 2]]);
  T.eq(validate({ cases: [{ id: 'a', t: 'task', title: 'Bil', c: '2026-11-01', s: [['A', 0, '2026-13-01'], ['B', 0, '2026-11-20']] }] }).cases[0].s, [['A', 0], ['B', 0, '2026-11-20']]);
});
T.test('upprepa: arkiverat ärende ger ett nytt med datum flyttade, bockar och delmål nollställda', () => {
  const s = validate({ cases: [{ id: 'c1', t: 'eco', title: 'Bilskatt', c: '2026-01-10', u: '2026-01-10', r: 'm', f: { wh: 'Skatt', du: '2026-01-31', pd: 1 },
    s: [['Betala', 1, '2026-01-30'], ['Spara kvitto', 1]], l: [['2026-01-10', 'x']], o: [['Påminn', 'dt', '2026-01-29T08:00', '']] }] });
  T.eq(s.cases[0].r, 'm');
  const n = nextCase(s, s.cases[0], '2026-02-01');
  T.eq(n.f, { wh: 'Skatt', du: '2026-02-28' });
  T.eq(n.s, [['Betala', 0, '2026-02-28'], ['Spara kvitto', 0]]);
  T.eq(n.o, [['Påminn', 'dt', '2026-02-28T08:00', '']]);
  T.eq([n.r, n.l, n.c, s.cases.length], ['m', undefined, '2026-02-01', 2]);
  T.eq(firstDate(s, n), '2026-02-28');
  T.eq(addMonths('2028-02-29', 12), '2029-02-28');
  T.eq(validate({ cases: [{ id: 'a', t: 'eco', title: 'x', c: '2026-01-10', r: 'q' }] }).cases[0].r, undefined);
  T.eq(nextCase(s, { ...s.cases[0], r: undefined }, '2026-02-01'), null);
});
T.test('papperskorg: ta bort, återställ, radera efter vald tid, validering', () => {
  const s = base(), c = s.cases[0];
  T.ok(trashCase(s, c, '2026-11-01'));
  T.eq([s.cases.length, s.trash.length, s.trash[0].d], [0, 1, '2026-11-01']);
  const v = validate(JSON.parse(JSON.stringify(s)));
  T.eq([v.trash.length, v.trash[0].d, v.trashDays], [1, '2026-11-01', 30]);
  T.eq(purgeTrash(s, '2026-11-30'), 0);
  T.eq(restoreCase(s, 'c1').id, 'c1'); T.eq([s.cases.length, s.trash.length, s.cases[0].d], [1, 0, undefined]);
  trashCase(s, s.cases[0], '2026-11-01');
  T.eq(purgeTrash(s, '2026-12-01'), 1);
  s.trashDays = 0; trashCase(s, validate({ cases: [{ id: 'z', t: 'sym', title: 'x', c: '2020-01-01' }] }).cases[0], '2020-01-01');
  s.cases.unshift(s.trash[0]); s.trash.pop(); trashCase(s, s.cases[0], '2020-01-01');
  T.eq(purgeTrash(s, '2030-01-01'), 0);
  T.eq(validate({ trash: [{ id: 'q', t: 'sym', title: 'x', c: '2026-01-01' }], trashDays: 5 }).trash.length, 0, 'utan datum hoppas över');
  T.eq(validate({ cases: [{ id: 'q', t: 'sym', title: 'a', c: '2026-01-01' }], trash: [{ id: 'q', t: 'sym', title: 'b', c: '2026-01-01', d: '2026-01-02' }] }).trash.length, 0, 'samma id som ärende');
});
T.test('lagring: arkivet packas och läses tillbaka, öppna ärenden okomprimerade', async () => {
  const mem = new Map();
  globalThis.localStorage = { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => { mem.set(k, String(v)); }, removeItem: (k) => mem.delete(k) };
  const txt = 'Åäö ✅ 🩺 ' + 'ringde vården fick tid '.repeat(20);
  T.eq(await unpack(await pack(txt)), txt);
  const s = defaults();
  for (let i = 0; i < 300; i++) s.cases.push({ id: 'c' + i, t: 'sym', title: 'Ärende ' + i, c: '2026-01-01', u: '2026-01-01', ...(i % 3 ? { x: '2026-02-01' } : {}), l: [['2026-01-01', txt]] });
  trashCase(s, s.cases[1], '2026-11-01');
  save(s);
  T.ok(!JSON.parse(mem.get('sk.data')).arch, 'först hela datan okomprimerad');
  await new Promise((r) => setTimeout(r, 50));
  const rest = JSON.parse(mem.get('sk.data'));
  T.eq([rest.arch, rest.cases.length, rest.trash.length], [1, 100, 0]);
  T.ok(mem.get('sk.arch').length * 5 < JSON.stringify(s).length, 'arkivet minst 5 gånger mindre');
  const back = await loadFull(load());
  T.eq([back.cases.length, back.trash.length], [299, 1]);
  T.eq(back.cases.find((c) => c.id === 'c2'), validate(s).cases.find((c) => c.id === 'c2'));
  T.eq(trashArchivedBefore(back, '2026-03-01', '2026-11-14'), 199);
  delete globalThis.localStorage;
});
T.test('lagring: arkivet läses in efteråt; det som stängs innan dess går inte förlorat', async () => {
  const mem = new Map();
  globalThis.localStorage = { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => { mem.set(k, String(v)); } };
  const s = defaults();
  for (let i = 0; i < 20; i++) s.cases.push({ id: 'c' + i, t: 'sym', title: 'Ä ' + i, c: '2026-01-01', u: '2026-01-01', ...(i < 15 ? { x: '2026-02-01' } : {}) });
  await loadFull(s); save(s); await new Promise((r) => setTimeout(r, 30));
  const early = load();   // new start: only open cases
  T.eq([early.cases.length, archReady()], [5, false]);
  early.cases[0].x = '2026-11-14'; save(early);   // closed before the archive is in
  const again = load(); T.eq(again.cases.length, 5, 'stängt ärende ligger kvar i sk.data');
  const full = await loadFull(early);
  T.eq([full.cases.length, full.cases.filter((c) => c.x).length, archReady()], [20, 16, true]);
  save(full); await new Promise((r) => setTimeout(r, 30));
  T.eq((await loadFull(load())).cases.filter((c) => c.x).length, 16, 'packat efter inläsning');
  delete globalThis.localStorage;
});
T.test('delmål: avbockning sparar klart-datum, deadline behålls, avbockning ångrad tar bort datumet', () => {
  const c = { s: [['Ring', 0, '2026-11-20'], ['Boka', 0]] };
  setStepDone(c, 0, 1, '2026-11-14'); setStepDone(c, 1, 1, '2026-11-14');
  T.eq(c.s, [['Ring', 1, '2026-11-20', '2026-11-14'], ['Boka', 1, 0, '2026-11-14']]);
  setStepDone(c, 0, 0, '2026-11-15');
  T.eq(c.s[0], ['Ring', 0, '2026-11-20']);
  const v = validate({ cases: [{ id: 'a', t: 'sym', title: 'x', c: '2026-01-01', s: [['A', 1, 0, '2026-11-14'], ['B', 0, 0, '2026-11-14'], ['C', 1, 'x', 'bad']] }] });
  T.eq(v.cases[0].s, [['A', 1, 0, '2026-11-14'], ['B', 0], ['C', 1]]);
});
T.test('delmål som upprepas: avbockning ger nästa tur, ångrad avbockning tar bort den', () => {
  const c = { s: [['Byt däck', 0, '2026-11-01']] };
  T.ok(setStepRepeat(c, 0, 'y', '2026-11-14'));
  setStepDone(c, 0, 1, '2026-11-14');
  T.eq(c.s, [['Byt däck', 1, '2026-11-01', '2026-11-14'], ['Byt däck', 0, '2027-11-01', 0, 'y']]);
  setStepDone(c, 0, 0, '2026-11-14');
  T.eq(c.s, [['Byt däck', 0, '2026-11-01', 0, 'y']]);
  const m = { s: [['Tanka', 0, 0, 0, 'm']] }; setStepDone(m, 0, 1, '2026-01-31');
  T.eq(m.s[1], ['Tanka', 0, '2026-02-28', 0, 'm']);
});

T.test('sortering: kolumn, riktning, tomma sist, validering', () => {
  const st = validate({ sort: { cases: 't+', arch: 'q-' } });
  T.eq(st.sort, { cases: 't+' });
  T.eq(sortOf(st, 'arch'), 'x-');
  const cs = [{ id: 'a', title: 'Öl', c: '2026-01-02', u: '2026-03-01' }, { id: 'b', title: 'apa', c: '2026-01-03', u: '2026-02-01' }, { id: 'c', title: 'Bil', c: '2026-01-01', u: '2026-04-01' }];
  T.eq(sortCases(st, cs, 't+').map((c) => c.id), ['b', 'c', 'a']);
  T.eq(sortCases(st, cs, 't-').map((c) => c.id), ['a', 'c', 'b']);
  T.eq(sortCases(st, cs, 'u-').map((c) => c.id), ['c', 'a', 'b']);
  T.eq(sortCases(st, cs, 'c+').map((c) => c.id), ['c', 'a', 'b']);
  T.eq(sortCases(st, [{ id: 'n', title: 'x' }, { id: 'a', title: 'y', x: '2026-05-01' }], 'x+').map((c) => c.id), ['a', 'n'], 'utan värde sist');
  T.eq(nextSort(st, 'cases', 't'), 't-'); T.eq(nextSort(st, 'cases', 'u'), 'u-'); T.eq(nextSort(st, 'cases', 'd'), 'd+');
});
T.test('Inköp: veckovis, varor med komma, avbockade sist', () => {
  const st = defaults(), c = newCase(st, 'shop', 'Veckohandling', '2026-11-15');
  T.eq(c.r, 'w');
  T.eq(splitItems(' mjölk, bröd;ägg\n, '), ['mjölk', 'bröd', 'ägg']);
  c.s = [['mjölk', 1, 0, '2026-11-15'], ['bröd', 0], ['ägg', 0]]; c.f = { d: '2026-11-16' };
  T.eq(stepOrder(c).map(([x, i]) => x[0] + i), ['bröd1', 'ägg2', 'mjölk0']);
  c.x = '2026-11-15'; const n = nextCase(st, c, '2026-11-15');
  T.eq([n.r, n.f.d, n.s.map((x) => x[1])], ['w', '2026-11-23', [0, 0, 0]]);
  const m = { s: [['Byt lakan', 0, '2026-11-15', 0, 'w']] }; setStepDone(m, 0, 1, '2026-11-15');
  T.eq(m.s[1], ['Byt lakan', 0, '2026-11-22', 0, 'w']);
});
T.test('version 7: Handla och Inköp läggs till i gammal data', () => {
  const s = validate({ version: 6, cats: [{ id: 'h', name: 'Hälsa', color: 'pink' }, { id: 'o', name: 'Övrigt', color: 'gray' }], types: [{ id: 'task', name: 'Uppgift', cat: 'o', on: 1, fields: [] }] });
  T.eq(s.cats.map((c) => c.id), ['h', 's', 'o']);
  T.eq(s.types.map((t) => t.id + t.on + (t.r || '')), ['task1', 'shop1w']);
  T.eq(validate({ version: 7, types: [{ id: 'task', name: 'Uppgift', cat: 'o', on: 1, fields: [] }] }).types.length, 1, 'borttagen typ kommer inte tillbaka');
});
