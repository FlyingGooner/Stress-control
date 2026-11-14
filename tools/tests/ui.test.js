// UI flow tests in dist/stress-kontroll.html with tools/tests/ui-seed.json (today.txt: 2026-11-14). Run: tools\test.ps1 stress-kontroll
const q = (s) => document.querySelector(s);
const qa = (s) => [...document.querySelectorAll(s)];
const stored = () => JSON.parse(localStorage.getItem('sk.data'));
const tab = async (v) => { q(`.tabbar [data-view="${v}"]`).click(); await T.wait(); };
const change = (e, v) => { if (e.type === 'checkbox') e.checked = v; else e.value = v; e.dispatchEvent(new Event('change', { bubbles: true })); };

T.test('startar i Ärenden med öppna ärenden och färg per kategori', () => {
  T.ok(/^v\d+\.\d+\.\d+$/.test(q('#version').textContent), 'version');
  T.eq(qa('.case-row').map((b) => b.querySelector('.case-title').textContent), ['Utvecklare, Acme', 'Ont i knät']);
  T.ok(q('.case-row[data-id="c1"]').classList.contains('c-pink'), 'Hälsa = rosa');
  T.eq(q('.case-row[data-id="c1"] .case-prog').textContent, '1/3');
});
T.test('filter per kategori', async () => {
  q('[data-act="filter"][data-id="j"]').click(); await T.wait();
  T.eq(qa('.case-row').length, 1);
  q('[data-act="filter"][data-id="all"]').click(); await T.wait();
  T.eq(qa('.case-row').length, 2);
});
T.test('nytt symptom: rubrik krävs, typens delmål läggs in, fält sparas direkt', async () => {
  q('[data-act="pickopen"]').click();
  q('[data-act="cnew"][data-id="sym"]').click();
  T.ok(q('#new-error').textContent, 'rubrik krävs');
  q('#new-title').value = 'Yrsel <b>';
  q('[data-act="cnew"][data-id="sym"]').click();
  await T.wait();
  const c = stored().cases[0];
  T.eq([c.title, c.t, c.s.length], ['Yrsel <b>', 'sym', 3]);
  T.ok(!q('#app b'), 'rubriken visas som text');
  change(q('#f-s1'), 'Snurrar när jag reser mig');
  change(q('#f-s3'), true);
  change(q('#f-s4'), '2026-11-14T08:05');
  T.eq(stored().cases[0].f, { s1: 'Snurrar när jag reser mig', s3: 1, s4: '2026-11-14T08:05' });
});
T.test('delmål och logg', async () => {
  change(qa('[data-act="stog"]')[0], true);
  T.eq(stored().cases[0].s[0][1], 1);
  q('#s-new').value = 'Boka blodprov'; q('[data-act="sadd"]').click();
  T.eq(stored().cases[0].s.at(-1), ['Boka blodprov', 0]);
  q('#l-new').value = 'Ringde 1177'; q('[data-act="ladd"]').click();
  T.eq(stored().cases[0].l, [['2026-11-14', 'Ringde 1177']]);
});
T.test('stäng → Arkiv; öppna igen', async () => {
  q('[data-act="cdone"]').click();
  await T.wait(50);
  const id = stored().cases[0].id;
  T.eq(stored().cases[0].x, '2026-11-14');
  T.ok(!q(`.case-row[data-id="${id}"]`), 'inte bland öppna');
  await tab('archive');
  T.ok(q(`.case-row[data-id="${id}"]`), 'i arkivet');
  q('#arch-q').value = 'yrsel'; q('#arch-q').dispatchEvent(new Event('input', { bubbles: true }));
  T.eq(qa('#arch-list .case-row').length, 1);
  q(`.case-row[data-id="${id}"]`).click();
  q('[data-act="creopen"]').click();
  T.ok(!('x' in stored().cases[0]), 'öppet igen');
  q('[data-act="cclose"]').click();
  await T.wait(50);
});
T.test('bakåt stänger ärendet och går till föregående flik', async () => {
  await tab('cases');
  q('.case-row[data-id="c1"]').click();
  T.ok(q('#c-title'), 'ärendet öppet');
  history.back();
  await T.until(() => !q('#c-title') && q('.case-row'), 'bakåt stänger ärendet');
  await tab('overview');
  history.back();
  await T.until(() => q('#app').dataset.view === 'cases', 'bakåt till Ärenden');
});
T.test('Överblick: per kategori och äldsta öppna', async () => {
  await tab('overview');
  T.ok(q('.bars .c-pink progress'), 'Hälsa-stapel');
  T.ok(q('#app').textContent.includes('Äldsta öppna'), 'äldsta');
});
T.test('egen ärendetyp Hus med bockar, och ett ärende av den', async () => {
  await tab('settings');
  q('[data-act="tnew"]').click();
  const set = (e, v) => { e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); };
  set(q('#t-name'), 'Hus');
  q('[data-act="fadd"]').click();
  const names = qa('[data-act="fname"]');
  set(names[0], 'Pratat med banken'); set(names[1], 'Banken godkänt');
  qa('[data-act="fkind"]').forEach((s) => change(s, 'check'));
  set(q('#t-steps'), 'Ring banken\nFå besked');
  q('[data-act="tsave"]').click();
  await T.wait(50);
  const t = stored().types.at(-1);
  T.eq([t.name, t.fields.map((f) => [f.name, f.kind]), t.steps], ['Hus', [['Pratat med banken', 'check'], ['Banken godkänt', 'check']], ['Ring banken', 'Få besked']]);
  await tab('cases');
  q('[data-act="pickopen"]').click();
  q('#new-title').value = 'Storgatan 5';
  q(`[data-act="cnew"][data-id="${t.id}"]`).click();
  await T.wait();
  change(qa('[data-act="fv"]')[0], true);
  T.eq(stored().cases[0].f, { f1: 1 });
  q('[data-act="cclose"]').click();
  await T.wait(50);
});
T.test('typ på/av i inställningar styr typväljaren', async () => {
  await tab('settings');
  change(q('[data-act="ton"][data-id="dent"]'), true);
  await tab('cases');
  q('[data-act="pickopen"]').click();
  T.ok(q('[data-act="cnew"][data-id="dent"]'), 'Tandvård valbar');
  q('[data-act="pickclose"]').click();
  await T.wait(50);
});
T.test('ta bort ärende: till papperskorgen, ångra, återställ från Arkiv', async () => {
  const n = stored().cases.length;
  q('.case-row[data-id="c2"]').click();
  q('[data-act="cdel"]').click();
  T.eq([stored().cases.length, stored().trash.length], [n - 1, 1]);
  q('#snack-action').click();
  T.eq([stored().cases.length, stored().trash.length], [n, 0]);
  await T.wait(50);
  q('.case-row[data-id="c2"]').click();
  q('[data-act="cdel"]').click(); await T.wait();
  await tab('settings');
  q('[data-act="trashopen"]').click(); await T.wait();
  q('[data-act="cexp"][data-id="c2"]').click(); await T.wait();
  q('[data-act="trest"][data-id="c2"]').click(); await T.wait();
  T.ok(q('.add-title').textContent.includes('(0)'), 'papperskorgen tom');   // sk.data holds open cases only once the archive is packed
  T.ok(stored().cases.some((c) => c.id === 'c2'), 'återställd');
  q('[data-act="trashclose"]').click(); await T.wait();
  await tab('cases');
});
T.test('Inställningar: Data och Hjälp', async () => {
  await tab('settings');
  T.ok(q('[data-act="backupsave"]') && q('#import-file') && q('[data-act="wipe"]'), 'Data');
  T.ok(qa('.help-wrap details').length >= 8, 'Hjälp från MANUAL.md');
});
