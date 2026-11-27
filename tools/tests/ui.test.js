// UI flow tests (T API) in the built app with tools/tests/ui-seed.json. 2026-11-22: omgjord app.
const q = (s) => document.querySelector(s);
const qa = (s) => [...document.querySelectorAll(s)];
const stored = () => JSON.parse(localStorage.getItem('sk.data'));
const tab = async (v) => { q(`.tabbar [data-view="${v}"]`).click(); await T.wait(); };
const change = (e, v) => { if (e.type === 'checkbox') e.checked = v; else e.value = v; e.dispatchEvent(new Event('change', { bubbles: true })); };

T.test('startar i Ärenden: närmast deadline först, utan deadline sist', () => {
  T.ok(/^v\d+\.\d+\.\d+$/.test(q('#version').textContent), 'version');
  T.eq(qa('.case-row .case-title').map((x) => x.textContent), ['Utvecklare, Acme', 'Ont i knät', 'Utan deadline']);
  T.eq(q('.case-row[data-id="c1"] .case-prog').textContent, '1/3');
});
T.test('personfilter', async () => {
  change(q('select[data-act="pfilter"]'), 'p1'); await T.wait();
  T.eq(qa('.case-row').length, 1);
  change(q('select[data-act="pfilter"]'), 'all'); await T.wait();
  T.eq(qa('.case-row').length, 3);
});
T.test('nytt ärende: öppnas direkt, sparas först när det får en rubrik', async () => {
  const n = stored().cases.length;
  q('[data-act="pickopen"]').click(); await T.wait();
  T.ok(q('#c-title') && !q('#c-title').value, 'tomt ärende öppet');
  change(q('#c-desc'), 'Före rubriken'); await T.wait();
  T.eq(stored().cases.length, n, 'inget sparat utan rubrik');
  change(q('#c-title'), 'Fixa <b>markisen'); await T.wait();
  T.eq([stored().cases[0].title, stored().cases[0].d], ['Fixa <b>markisen', 'Före rubriken']);
  T.ok(!q('#app b') && q('[data-act="cdone"]'), 'rubriken som text, knapparna syns');
});
T.test('färg: en prick, tryck öppnar väljaren', async () => {
  q('details.color-pick > summary').click(); await T.wait();
  T.ok(q('details.color-pick').open);
  q('[data-act="ccol"][data-id="blue"]').click(); await T.wait();
  T.eq(stored().cases[0].k, 'blue');
  T.ok(!q('details.color-pick').open, 'stängs efter val');
});
T.test('beskrivning, deadline, delmål och anteckning sparas direkt', async () => {
  change(q('#c-desc'), 'Rad 1\nRad 2');
  change(q('.due-date'), '2026-12-01'); await T.wait();
  change(q('.due-time'), '09:30'); await T.wait();
  q('#s-new').value = 'Ring firman'; q('[data-act="sadd"]').click(); await T.wait();
  q('#l-new').value = 'Ringde'; q('[data-act="ladd"]').click(); await T.wait();
  const c = stored().cases[0];
  T.eq([c.d, c.due, c.s, c.l.length], ['Rad 1\nRad 2', '2026-12-01T09:30', [['Ring firman', 0]], 1]);
  change(q('[data-act="stog"]'), true); await T.wait();
  T.eq(stored().cases[0].s[0][1], 1);
});
T.test('spara som mall och starta nytt ärende från den', async () => {
  q('[data-act="tsave"]').click(); await T.wait();
  T.eq(stored().tpls.map((t) => t.title), ['Boka tandläkare', 'Fixa <b>markisen']);
  q('[data-act="cclose"]').click(); await T.wait();
  q('[data-act="pickopen"]').click(); await T.wait();
  q('[data-act="cfromtpl"][data-id="t1"]').click(); await T.wait();
  const c = stored().cases[0];
  T.eq([c.title, c.d, c.s], ['Boka tandläkare', 'Ring 08-123 45', [['Ring', 0], ['Gå dit', 0]]]);
});
T.test('klar → arkiv, öppna igen', async () => {
  q('[data-act="cdone"]').click(); await T.wait();
  T.ok(!stored().cases.some((c) => c.title === 'Boka tandläkare'), 'inte bland öppna (arkivet sparas komprimerat i sk.arch)');
  await tab('archive');
  T.ok(qa('.case-row .case-title').some((x) => x.textContent === 'Boka tandläkare'));
  q('.case-row').click(); await T.wait();
  q('[data-act="creopen"]').click(); await T.wait();
  T.eq(stored().cases.find((c) => c.title === 'Boka tandläkare')?.x, undefined);
  q('[data-act="cclose"]').click(); await tab('cases');
});
T.test('ta bort → papperskorg, återställ', async () => {
  q('.case-row[data-id="c3"]').click(); await T.wait();
  q('[data-act="cdel"]').click(); await T.wait();
  T.ok(!stored().cases.some((c) => c.id === 'c3'), 'borta från öppna');
  await tab('settings');
  q('[data-act="trashopen"]').click(); await T.wait();
  T.eq(qa('[data-act="trest"]').map((b) => b.dataset.id), ['c3']);
  q('[data-act="trest"][data-id="c3"]').click(); await T.wait();
  T.ok(stored().cases.some((c) => c.id === 'c3'), 'tillbaka bland öppna');
});
T.test('kalender: prickar för deadlines, tryck på en dag, byt månad', async () => {
  await tab('calendar');
  const cell = (k) => q(`.cal-cell[data-id="${k}"]`);
  T.ok(cell('2026-11-14').classList.contains('today') && cell('2026-11-14').classList.contains('sel'), 'idag vald');
  T.eq(qa(`.cal-cell[data-id="2026-11-18"] .cal-dot`).length, 1);
  T.ok(cell('2026-11-12').classList.contains('late'), 'försenad');
  cell('2026-11-18').click(); await T.wait();
  T.eq(qa('.case-row .case-title').map((x) => x.textContent), ['Ont i knät']);
  q('[data-act="cmonth"][data-id="1"]').click(); await T.wait();
  T.ok(cell('2026-12-01') && !cell('2026-11-18'), 'december');
  q('[data-act="cmonth"][data-id="-1"]').click(); q('[data-act="cmonth"][data-id="-1"]').click(); await T.wait();
  T.ok(cell('2026-10-05'), 'oktober');
  q('[data-act="cmonth"][data-id="0"]').click(); await T.wait();
  T.ok(cell('2026-11-14').classList.contains('sel'), 'tillbaka till idag');
  await tab('cases');
});
T.test('flikbyte och Bakåt stänger ett osparat Nytt ärende', async () => {
  q('[data-act="pickopen"]').click(); await T.wait();
  T.ok(q('#c-title'), 'utkast öppet');
  await tab('calendar'); await tab('cases');
  T.ok(!q('#c-title') && q('.case-row'), 'listan, inte utkastet');
});
