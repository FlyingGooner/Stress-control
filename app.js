// Stress kontroll – no external calls, localStorage only. See CLAUDE.md. Views in views/*.js, shared state in ui.js,
// Bakåt-logic in nav.js. Same structure as simple-nutrition/app.js. Rendering: el()/textContent only – never innerHTML.
import { save, loadFailed, cleanText, uid, newCase, setField, validDate, changeType, typeChangeLoss, addExtra, setExtra, alerts, ALERT_DAYS, cleanType, LIM, COLORS, KINDS } from './store.js';
import { today, S, setOpen, longDate, shortDate, el } from './ui.js';
import { topLayer, layerDepth, closeTop, isDirty } from './nav.js';
import { viewCases, showVal } from './views/cases.js';
import { viewOverview } from './views/overview.js';
import { viewArchive, archiveList } from './views/archive.js';
import { viewSettings } from './views/settings.js';
import { initData, saveBackup, maybeAskBackup, readBackup, openImport } from './views/data.js';

const CONFIG = { startView: 'cases' };
document.getElementById('version').textContent = 'v' + self.APP_VERSION;
const app = document.getElementById('app');
const tabbar = document.querySelector('.tabbar');
const errText = (id, t) => { const e = document.getElementById(id); if (e) e.textContent = t; };

/* ---------- Status line (#status) – fixed texts only ---------- */
let saveFailed = false;
function persist() {
  if (!save(S.state)) status('Ändringen sparades inte – lagringen är full eller blockerad. Spara en backup-fil och ta bort gamla ärenden.', true);
  else if (saveFailed) updateOnline();
}
function status(text, isError = false) {
  const s = document.getElementById('status');
  s.textContent = text;
  s.classList.toggle('error', isError);
  saveFailed = isError;
}
// Unreadable saved data (store.js load()): the warning stays until reload; the raw text is kept under sk.data.broken.
const LOAD_MSG = 'Den sparade datan gick inte att läsa. En kopia av den finns kvar i webbläsaren. Spara en backup-fil av det du lägger in nu.';
function updateOnline() {
  if (loadFailed()) { status(LOAD_MSG, true); saveFailed = false; return; }
  status(navigator.onLine ? '' : 'Offline – allt fungerar ändå, data finns på enheten.');
}
addEventListener('online', updateOnline);
addEventListener('offline', updateOnline);
updateOnline();

/* ---------- Snackbar (undo, update) ---------- */
let snackTimer = null;
function snackbar(text, actionText, action, ms = 5000) {
  const bar = document.getElementById('snackbar'), btn = document.getElementById('snack-action');
  document.getElementById('snack-text').textContent = text;
  btn.hidden = !actionText;
  btn.textContent = actionText || '';
  btn.onclick = () => { bar.hidden = true; if (action) action(); };
  bar.hidden = false;
  clearTimeout(snackTimer);
  if (ms) snackTimer = setTimeout(() => { bar.hidden = true; }, ms);
}
function withUndo(label, change) {
  const before = JSON.stringify(S.state);
  change();
  persist();
  render();
  snackbar(label, 'Ångra', () => { S.state = JSON.parse(before); persist(); render(); });
}

/* ---------- Confirm delete (#del-dialog): focus starts on Avbryt ---------- */
let delAction = null;
function confirmDelete(title, text, action) {
  document.getElementById('del-title').textContent = title;
  document.getElementById('del-text').textContent = text;
  delAction = action;
  const dlg = document.getElementById('del-dialog');
  dlg.showModal();
  document.getElementById('del-cancel').focus();
}
document.getElementById('del-ok').addEventListener('click', () => { const a = delAction; delAction = null; if (a) a(); });
document.getElementById('del-dialog').addEventListener('close', () => { delAction = null; });

/* ---------- Router (mobile only, see ../STIL.md) ---------- */
const VIEWS = { cases: viewCases, overview: viewOverview, archive: viewArchive, settings: viewSettings };
let view = CONFIG.startView;
function render() {
  app.dataset.view = view;
  app.replaceChildren(...[VIEWS[view]()].flat(Infinity).filter(Boolean));
  for (const t of tabbar.querySelectorAll('[data-view]')) {
    const on = t.dataset.view === view;
    t.classList.toggle('on', on);
    if (on) t.setAttribute('aria-current', 'page'); else t.removeAttribute('aria-current');
  }
  // Red count on Överblick: dates within the reminder time and passed deadlines.
  const ov = tabbar.querySelector('[data-view="overview"]'), na = alerts(S.state, today()).length;
  let bd = ov.querySelector('.tab-badge');
  if (na && !bd) { bd = el('span', { class: 'tab-badge' }); ov.append(bd); }
  if (bd) { bd.hidden = !na; bd.textContent = na > 99 ? '99+' : String(na); }
  ov.setAttribute('aria-label', na ? `Överblick, ${na} aktuella` : 'Överblick');
  syncHistory();
}
/* ---------- Bakåt (som simple-nutrition): flikar och lager i historiken, popstate stänger det översta ---------- */
// Bakåt stänger det översta lagret (nav.js), sedan föregående flik; appen stängs först i startvyn.
// histDepth = open layers that have a history step. A layer that opens gets pushState; one closed by a button goes back
// with history.go(), so no step points at a closed layer. While our own history.go() runs (ownNav) nothing is pushed:
// tab changes wait in pendingView and new layers are pushed when popstate comes.
let histDepth = 0, navTimer = 0, discard = false, pendingView = null, ownNav = false;
function syncHistory() {
  if (ownNav) return;
  const d = layerDepth(S);
  if (d > histDepth) { for (let i = histDepth + 1; i <= d; i++) history.pushState({ app: 1, layer: topLayer(S), depth: i }, '', location.hash); histDepth = d; }
  else if (d < histDepth) {
    const k = histDepth - d; histDepth = d; ownNav = true;
    S.navPending = true; clearTimeout(navTimer);   // double-tap guard: real taps ignored until popstate, at most 400 ms
    navTimer = setTimeout(() => { S.navPending = false; }, 400);
    history.go(-k);
  }
}
function go(v, push = true) {
  if (!Object.hasOwn(VIEWS, v)) v = CONFIG.startView;
  if (push && ownNav) { pendingView = v; return; }
  // Layers closed by a tab change keep their steps; back skips them (popstate: step deeper than open layers → back again).
  if (push) histDepth = Math.min(histDepth, layerDepth(S));
  view = v;
  if (location.hash !== '#' + v) {
    if (push) history.pushState({ app: 1, depth: histDepth }, '', '#' + v); else history.replaceState({ app: 1, depth: histDepth }, '', '#' + v);
  }
  render();
  scrollTo(0, 0);
}
addEventListener('popstate', (e) => {
  S.navPending = false; clearTimeout(navTimer);
  const target = e.state?.depth ?? 0;
  if (ownNav) {   // our own history.go() arrived: catch up on what happened meanwhile
    ownNav = false; histDepth = target;
    if (pendingView) { const v = pendingView; pendingView = null; go(v); } else syncHistory();
    return;
  }
  if (layerDepth(S) > target) {
    if (topLayer(S) === 'tedit' && !discard && isDirty(S.tedit, S.teditOrig)) {
      history.pushState({ app: 1, layer: 'tedit', depth: histDepth }, '', location.hash);
      document.getElementById('discard-dialog').showModal();
      return;
    }
    discard = false;
    while (layerDepth(S) > target && closeTop(S));
    histDepth = layerDepth(S);
    render();
    return;
  }
  histDepth = target;
  const v = location.hash.slice(1);
  if (Object.hasOwn(VIEWS, v) && v !== view) { S.open = null; S.pick = false; S.draft = null; S.tedit = null; go(v, false); }
  else syncHistory();   // a stale layer step: go back past it
});
// "Släng" on the button itself (not the close event): two quick closes must never go back twice.
document.getElementById('dd-ok').addEventListener('click', () => { discard = true; history.back(); });
tabbar.addEventListener('click', (ev) => {
  const t = ev.target.closest('[data-view]');
  if (!t) return;
  ev.preventDefault();
  S.open = null; S.pick = false; S.draft = null; S.tedit = null;
  go(t.dataset.view);
});

/* ---------- Actions: one click handler, data-act on the element ---------- */
app.addEventListener('click', (ev) => {
  const t = ev.target.closest('[data-act]');
  if (!t || (S.navPending && ev.isTrusted)) return;
  const { act, id } = t.dataset;
  const cs = () => S.state.cases.find((x) => x.id === S.open);
  const touch = (c) => { c.u = today(); };
  switch (act) {
    // Ärenden
    case 'filter': S.filter = id; break;
    case 'pickopen': S.pick = true; S.draft = null; S.newTitle = ''; render(); scrollTo(0, 0); return;
    case 'pickclose': S.pick = false; S.draft = null; break;
    case 'ptype': {   // choose type: its form opens below; values already typed in fields with the same id are kept
      if (S.draft?.t === id) return;
      S.draft = { t: id, f: S.draft?.f };
      if (!S.draft.f) delete S.draft.f;
      const ty = S.state.types.find((x) => x.id === id);
      if (S.draft.f) { for (const k of Object.keys(S.draft.f)) if (!ty?.fields.some((f) => f.id === k)) delete S.draft.f[k]; }
      render(); app.querySelector('.draft')?.scrollIntoView({ block: 'nearest' }); return;
    }
    case 'cnew': {   // creates the case (open, not archived) and closes the picker
      const title = document.getElementById('new-title')?.value;
      if (!cleanText(title, 80)) { errText('new-error', 'Skriv en rubrik först.'); document.getElementById('new-title')?.focus(); return; }
      const c = newCase(S.state, id, title, today());
      if (!c) { errText('new-error', `Max ${LIM.cases} ärenden.`); return; }
      if (S.draft?.t === id && S.draft.f) { const f = {}; for (const [k, v] of Object.entries(S.draft.f)) f[k] = v; c.f = f; }
      S.pick = false; S.draft = null; S.newTitle = ''; persist(); render(); scrollTo(0, 0);   // saved and open: back to the list
      snackbar(`${c.title} är sparat`, null, null, 2500); return;
    }
    case 'cexp': S.exp = S.exp === id ? null : id; break;
    case 'copen': S.exp = null; S.open = id; render(); scrollTo(0, 0); return;
    case 'cclose': S.open = null; break;
    case 'cdone': {
      const c = cs(); if (!c) return;
      const u0 = c.u;
      c.x = today(); touch(c); S.open = null; persist();
      snackbar(`${c.title} är stängt och arkiverat`, 'Ångra', () => { delete c.x; c.u = u0; persist(); render(); });
      break;
    }
    case 'creopen': { const c = cs(); if (!c) return; delete c.x; touch(c); persist(); snackbar(`${c.title} är öppet igen`, null, null, 2500); break; }
    case 'cdel': {   // confirm first; Ångra stays as a second net
      const c = cs(); if (!c) return;
      const nl = (c.l || []).length, ns = (c.s || []).length;
      confirmDelete(`Ta bort ${c.title}?`, `${nl} ${nl === 1 ? 'loggrad' : 'loggrader'} och ${ns} delmål tas bort. Senast ändrat ${longDate(c.u)}.`, () => {
        S.open = null;
        withUndo(`${c.title} togs bort`, () => { S.state.cases = S.state.cases.filter((x) => x.id !== c.id); });
      });
      return;
    }
    case 'sadd': {
      const c = cs(), x = cleanText(document.getElementById('s-new')?.value, 80);
      if (!c || !x) { document.getElementById('s-new')?.focus(); return; }
      if ((c.s || []).length >= LIM.steps) { errText('c-error', `Max ${LIM.steps} delmål.`); return; }
      const sd = document.getElementById('s-date')?.value; (c.s ||= []).push(validDate(sd) ? [x, 0, sd] : [x, 0]); touch(c); persist(); render(); document.getElementById('s-new')?.focus(); return;
    }
    case 'oadd': {
      const c = cs(), n = document.getElementById('o-name'); if (!c) return;
      if (!addExtra(c, n?.value, document.getElementById('o-kind')?.value, today())) { errText('c-error', cleanText(n?.value, 40) ? 'Fältet finns redan, eller max antal fält.' : 'Skriv ett namn på fältet.'); n?.focus(); return; }
      persist(); render(); document.getElementById('f-o' + (c.o.length - 1))?.focus(); return;
    }
    case 'odel': { const c = cs(); if (!c?.o) return; const n = c.o[Number(t.dataset.i)]?.[0]; withUndo(`${n} togs bort`, () => { c.o.splice(Number(t.dataset.i), 1); if (!c.o.length) delete c.o; touch(c); }); return; }
    case 'oclear': { const c = cs(); if (!c?.o) return; withUndo('Extra fält borttagna', () => { delete c.o; touch(c); }); return; }
    case 'sdel': { const c = cs(); if (!c?.s) return; c.s.splice(Number(t.dataset.i), 1); if (!c.s.length) delete c.s; touch(c); persist(); break; }
    case 'ladd': {
      const c = cs(), x = cleanText(document.getElementById('l-new')?.value, 500, true);
      if (!c || !x) { document.getElementById('l-new')?.focus(); return; }
      (c.l ||= []).push([today(), x]); if (c.l.length > LIM.log) c.l.shift(); touch(c); persist(); break;
    }
    case 'ldel': {
      const c = cs(), i = Number(t.dataset.i); if (!c?.l?.[i]) return;
      const [d, x] = c.l[i];
      confirmDelete('Ta bort anteckningen?', `${shortDate(d)}: ${x.length > 120 ? x.slice(0, 120) + '…' : x}`, () => {
        withUndo('Anteckningen togs bort', () => { c.l.splice(i, 1); if (!c.l.length) delete c.l; });
      });
      return;
    }
    // Inställningar: ärendetyper och kategorier
    case 'topen': case 'tnew': {
      const t0 = act === 'tnew' ? { id: 't' + uid(), name: '', icon: '📌', cat: S.state.cats[0].id, on: 1, fields: [{ id: 'f1', name: 'Kommentar', kind: 'note' }], isNew: true }
        : S.state.types.find((x) => x.id === id);
      if (!t0) return;
      S.teditFor = null; S.tedit = { ...JSON.parse(JSON.stringify(t0)), steps: [...(t0.steps || [])] }; S.teditOrig = JSON.stringify(S.tedit);
      render(); scrollTo(0, 0); return;
    }
    case 'tfromcase': {   // new type = the case's type + its old fields; on Spara the case changes to it
      const c = cs(), ty = c && S.state.types.find((x) => x.id === c.t); if (!c?.o) return;
      const fields = [...(ty?.fields || []).map((f) => ({ name: f.name, kind: f.kind })), ...c.o.map(([n, k]) => ({ name: n, kind: k }))]
        .filter((f, i, a) => a.findIndex((g) => g.name === f.name && g.kind === f.kind) === i).slice(0, LIM.fields).map((f, i) => ({ id: 'f' + (i + 1), ...f }));
      S.tedit = { id: 't' + uid(), name: '', icon: ty?.icon || '📌', cat: ty?.cat || S.state.cats[0].id, on: 1, fields, steps: [], isNew: true };
      S.teditOrig = JSON.stringify(S.tedit); S.teditFor = c.id;
      render(); scrollTo(0, 0); return;
    }
    case 'tclose': S.tedit = null; S.teditFor = null; break;
    case 'fadd': {
      const d = S.tedit; if (d.fields.length >= LIM.fields) return;
      let n = d.fields.length + 1; while (d.fields.some((f) => f.id === 'f' + n)) n++;
      d.fields.push({ id: 'f' + n, name: '', kind: 'text' }); render(); app.querySelector('.field-edit:last-child input')?.focus(); return;
    }
    case 'fup': { const f = S.tedit.fields, i = Number(t.dataset.i); if (i > 0) [f[i - 1], f[i]] = [f[i], f[i - 1]]; break; }
    case 'fdel': S.tedit.fields.splice(Number(t.dataset.i), 1); break;
    case 'tsave': {
      const d = S.tedit, cats = new Set(S.state.cats.map((c) => c.id));
      const clean = cleanType({ ...d, fields: d.fields.map((f) => ({ ...f, name: cleanText(f.name, 40) })).filter((f) => f.name) }, cats);
      if (!clean) { errText('t-error', 'Ge typen ett namn.'); return; }
      const i = S.state.types.findIndex((x) => x.id === clean.id);
      if (i >= 0) S.state.types[i] = clean; else S.state.types.push(clean);
      // Values of removed fields are dropped from the type's cases (same as validate()).
      for (const c of S.state.cases) if (c.t === clean.id && c.f) { for (const k of Object.keys(c.f)) if (!clean.fields.some((f) => f.id === k)) delete c.f[k]; if (!Object.keys(c.f).length) delete c.f; }
      const fc = S.teditFor && S.state.cases.find((x) => x.id === S.teditFor);
      if (fc && fc.t !== clean.id) changeType(S.state, fc, clean.id, today());
      S.tedit = null; S.teditFor = null; persist(); snackbar(fc ? `${clean.name} sparad – ärendet använder den nu` : `${clean.name} sparad`, null, null, 3000); break;
    }
    case 'tdel': {
      const d = S.tedit; if (S.state.cases.some((c) => c.t === d.id)) return;
      S.tedit = null;
      withUndo(`${d.name || 'Typen'} togs bort`, () => { S.state.types = S.state.types.filter((x) => x.id !== d.id); });
      return;
    }
    case 'knew': {
      if (S.state.cats.length >= LIM.cats) return;
      S.state.cats.push({ id: 'k' + uid(), name: 'Ny kategori', color: COLORS[S.state.cats.length % COLORS.length] }); persist(); break;
    }
    case 'kdel': {
      const k = S.state.cats.find((c) => c.id === id);
      if (!k || S.state.types.some((x) => x.cat === id) || S.state.cats.length <= 1) return;
      withUndo(`${k.name} togs bort`, () => { S.state.cats = S.state.cats.filter((c) => c.id !== id); if (S.filter === id) S.filter = 'all'; });
      return;
    }
    case 'install':
      S.installPrompt?.prompt();
      S.installPrompt?.userChoice.finally(() => { S.installPrompt = null; render(); });
      return;
    case 'wipe': document.getElementById('confirm-dialog').showModal(); return;
    case 'import': openImport(document.getElementById('import-text').value); return;
    case 'backupsave': saveBackup(); return;
    default: return;
  }
  render();
});
app.addEventListener('input', (ev) => {
  const t = ev.target, d = S.tedit;
  if (t.id === 'new-title') { S.newTitle = t.value; return; }
  if (t.id === 'arch-q') { S.q = t.value; document.getElementById('arch-list')?.replaceChildren(archiveList()); return; }
  if (!d) return;
  if (t.dataset.act === 'tset' && ['name', 'icon'].includes(t.dataset.id)) d[t.dataset.id] = t.value;
  if (t.dataset.act === 'fname') { const f = d.fields[Number(t.dataset.i)]; if (f) f.name = t.value; }
  if (t.dataset.act === 'tsteps') d.steps = t.value.split('\n').map((x) => cleanText(x, 80)).filter(Boolean).slice(0, LIM.typeSteps);
});
/* ---------- Swipe sideways between the category filters in Ärenden (no layer open; not from the screen edges = system Back) ---------- */
let swipe = null;
document.addEventListener('touchstart', (ev) => {
  const t = ev.touches[0];
  swipe = ev.touches.length === 1 && !topLayer(S) && t.clientX > 24 && t.clientX < innerWidth - 24
    && !ev.target.closest('input, textarea, select, dialog') ? { x: t.clientX, y: t.clientY } : null;
}, { passive: true });
document.addEventListener('touchend', (ev) => {
  if (!swipe) return;
  const t = ev.changedTouches[0], dx = t.clientX - swipe.x, dy = t.clientY - swipe.y;
  swipe = null;
  if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 2) return;
  const chips = [...app.querySelectorAll('[data-act="filter"]')], i = chips.findIndex((x) => x.dataset.id === S.filter);
  if (i < 0) return;
  const next = chips[i + (dx < 0 ? 1 : -1)];
  if (next) { next.click(); app.querySelector('.chip.on')?.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
}, { passive: true });
app.addEventListener('keydown', (ev) => {
  if (ev.key !== 'Enter') return;
  if (ev.target.id === 's-new') { ev.preventDefault(); app.querySelector('[data-act="sadd"]')?.click(); }
  if (ev.target.id === 'o-name') { ev.preventDefault(); app.querySelector('[data-act="oadd"]')?.click(); }
  if (ev.target.id === 'new-title') { ev.preventDefault(); app.querySelector('.type-btn')?.focus(); }
});
app.addEventListener('toggle', (ev) => {
  const d = ev.target;
  if (d instanceof HTMLDetailsElement && d.dataset.sec) { if (d.open) setOpen.add(d.dataset.sec); else setOpen.delete(d.dataset.sec); }
}, true);
app.addEventListener('change', (ev) => {
  const t = ev.target;
  switch (t.dataset.act) {
    case 'importfile': readBackup(t); return;
    case 'dv': {   // a field in Nytt ärende: kept in the draft until Skapa
      const d = S.draft; if (!d) return;
      const ok = setField(S.state, d, t.dataset.id, t.type === 'checkbox' ? t.checked : t.value, today());
      errText('d-error', ok ? '' : 'Kontrollera värdet – t.ex. ett tal som 1 250.');
      return;
    }
    case 'ctype': {   // change type afterwards: values follow by field name, the rest goes to the log
      const c = S.state.cases.find((x) => x.id === S.open); if (!c) return;
      const to = S.state.types.find((x) => x.id === t.value); if (!to) return;
      const loss = typeChangeLoss(S.state, c, to.id);
      if (!loss.length) { if (changeType(S.state, c, to.id, today())) { persist(); render(); } return; }
      document.getElementById('ty-title').textContent = `Byta till ${to.name}?`;
      document.getElementById('ty-text').textContent = loss.length === 1 ? `Det här fältet finns inte i ${to.name}:` : `De här ${loss.length} fälten finns inte i ${to.name}:`;
      document.getElementById('ty-list').replaceChildren(...loss.map((x) => el('li', {}, el('b', { text: x.n + ': ' }), el('span', { text: showVal({ kind: x.k }, x.v) }))));
      const dlg = document.getElementById('type-dialog');
      dlg.onclose = () => {
        dlg.onclose = null;
        if (dlg.returnValue === 'keep') { changeType(S.state, c, to.id, today()); persist(); render(); snackbar('Bytt typ – fälten finns under Extra fält', null, null, 3000); }
        else if (dlg.returnValue === 'drop') withUndo(`Bytt till ${to.name}, ${loss.length} ${loss.length === 1 ? 'värde' : 'värden'} borttagna`, () => changeType(S.state, c, to.id, today(), true));
        else render();   // Avbryt: the list shows the old type again
      };
      dlg.returnValue = ''; dlg.showModal();
      return;
    }
    case 'ov': {   // an extra field in the case
      const c = S.state.cases.find((x) => x.id === S.open); if (!c) return;
      const ok = setExtra(c, Number(t.dataset.id.slice(1)), t.type === 'checkbox' ? t.checked : t.value, today());
      errText('c-error', ok ? '' : 'Kontrollera värdet – t.ex. ett tal som 1 250.'); if (ok) persist();
      return;
    }
    case 'fv': {   // a case field: saved directly; invalid input gives a message and is not saved
      const c = S.state.cases.find((x) => x.id === S.open); if (!c) return;
      const ok = setField(S.state, c, t.dataset.id, t.type === 'checkbox' ? t.checked : t.value, today());
      errText('c-error', ok ? '' : 'Kontrollera värdet – t.ex. ett tal som 1 250.');
      if (ok) persist();
      return;
    }
    case 'ctitle': {
      const c = S.state.cases.find((x) => x.id === S.open), v = cleanText(t.value, 80);
      if (c && v) { c.title = v; c.u = today(); persist(); } else if (c) t.value = c.title;
      return;
    }
    case 'sdate': {
      const c = S.state.cases.find((x) => x.id === S.open), row = c?.s?.[Number(t.dataset.i)]; if (!row) return;
      if (validDate(t.value)) row[2] = t.value; else row.length = 2;
      c.u = today(); persist(); render(); return;
    }
    case 'stog': {
      const c = S.state.cases.find((x) => x.id === S.open), row = c?.s?.[Number(t.dataset.i)]; if (!row) return;
      row[1] = t.checked ? 1 : 0; c.u = today(); persist(); render(); return;
    }
    case 'ton': { const ty = S.state.types.find((x) => x.id === t.dataset.id); if (ty) { ty.on = t.checked ? 1 : 0; persist(); } return; }
    case 'tset': if (S.tedit && t.dataset.id === 'cat') S.tedit.cat = t.value; return;
    case 'fkind': { const f = S.tedit?.fields[Number(t.dataset.i)]; if (f && Object.hasOwn(KINDS, t.value)) { f.kind = t.value; if (f.kind !== 'date' && f.kind !== 'dt') delete f.due; render(); } return; }
    case 'fdue': { const f = S.tedit?.fields[Number(t.dataset.i)]; if (f) { if (t.checked) f.due = 1; else delete f.due; } return; }
    case 'alertdays': { const v = Number(t.value); if (ALERT_DAYS.includes(v)) { S.state.alertDays = v; persist(); render(); } return; }
    case 'kname': {
      const k = S.state.cats.find((c) => c.id === t.dataset.id), v = cleanText(t.value, 30);
      if (k && v) { k.name = v; persist(); } else if (k) t.value = k.name;
      return;
    }
    case 'kcolor': { const k = S.state.cats.find((c) => c.id === t.dataset.id); if (k && COLORS.includes(t.value)) { k.color = t.value; persist(); render(); } return; }
    case 'bkremind': if (['week', 'month', 'off'].includes(t.value)) { S.state.backup.remind = t.value; S.state.backup.asked = null; persist(); } return;
  }
});

/* ---------- Install, refresh, service worker ---------- */
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); S.installPrompt = e; if (view === 'settings') render(); });
// Redraw when the app comes back – but not after a tap on the file field (the file picker hides the page; a redraw would
// replace the input and lose the chosen file).
let filePick = false;
app.addEventListener('click', (ev) => { if (ev.target.id === 'import-file') filePick = true; }, true);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') return;
  if (filePick) { filePick = false; return; }
  if (!document.activeElement?.matches?.('input, textarea, select')) render();
  setTimeout(maybeAskBackup, 300);
});

go(location.hash.slice(1), false);
initData({ persist, render, status, snackbar, view: () => view });
setTimeout(maybeAskBackup, 800);

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.register(window.trustedTypes ? trustedTypes.createPolicy('sw', { createScriptURL: (u) => (u === 'sw.js' ? u : '') }).createScriptURL('sw.js') : 'sw.js', { updateViaCache: 'none' }).catch(() => { /* app still works */ });
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hadController) snackbar('Ny version finns', 'Ladda om', () => location.reload(), 0);
  });
}
