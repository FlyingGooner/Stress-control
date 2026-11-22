// Task buddy – no external calls, localStorage only. See CLAUDE.md. Views in views/*.js, shared state in ui.js,
// Bakåt-logic in nav.js. Same structure as simple-nutrition/app.js. Rendering: el()/textContent only – never innerHTML.
// 2026-11-22: omgjord – ärenden med rubrik, beskrivning, deadline, person, delmål och logg; mallar som rätterna i Fitness buddy.
import { save, loadFailed, cleanText, tidyNote, uid, newCase, saveTemplate, makeDue, dueNow, trashCase, restoreCase, purgeTrash, TRASH_DAYS, loadFull, setSaveErrorHandler, storageUsed, STORAGE_QUOTA, archReady, roomFor, LIM, COLORS, DESC_CHARS, LOG_CHARS, TITLE_CHARS, STEP_CHARS } from './store.js';
import { today, S, setOpen, el, cur } from './ui.js';
import { topLayer, layerDepth, closeTop } from './nav.js';
import { viewCases } from './views/cases.js';
import { viewArchive, archiveList } from './views/archive.js';
import { viewTrash } from './views/trash.js';
import { viewSettings } from './views/settings.js';
import { initData, saveBackup, maybeAskBackup, readBackup, openImport, rememberPassword, copyPassword, ownPassword, exportCsv } from './views/data.js';

const CONFIG = { startView: 'cases' };
document.getElementById('version').textContent = 'v' + self.APP_VERSION;
const app = document.getElementById('app');
const tabbar = document.querySelector('.tabbar');
const errText = (id, t) => { const e = document.getElementById(id); if (e) e.textContent = t; };

/* ---------- Status line (#status) – fixed texts only ---------- */
let saveFailed = false;
const SAVE_MSG = 'Ändringen sparades inte – lagringen är full eller blockerad. Spara en backup-fil och rensa arkivet eller papperskorgen (Inställningar).';
setSaveErrorHandler(() => status(SAVE_MSG, true));
let saves = 0;
// archTouched: a closed case is open in the editor, or types changed (cases updated in place) – see store.js save().
function persist(archTouched = false) {
  const d = S.draft;   // Nytt ärende: saved first when it has a title
  if (d && S.open === d.id && cleanText(d.title, TITLE_CHARS)) { S.draft = null; S.state.cases.unshift(d); }
  const oc = S.open && S.state.cases.find((x) => x.id === S.open);
  if (!save(S.state, archTouched || !!oc?.x)) { status(SAVE_MSG, true); return; }
  if (saveFailed) updateOnline();
  if (++saves % 20 === 1 && storageUsed() > STORAGE_QUOTA * 0.9) snackbar('Lagringen är nästan full – rensa arkivet eller papperskorgen under Inställningar', null, null, 6000);
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
const VIEWS = { cases: viewCases, archive: viewArchive, settings: () => (S.trash ? viewTrash() : viewSettings()) };
let view = CONFIG.startView;
function render() {
  app.dataset.view = view;
  app.replaceChildren(...[VIEWS[view]()].flat(Infinity).filter(Boolean));
  for (const t of tabbar.querySelectorAll('[data-view]')) {
    const on = t.dataset.view === view;
    t.classList.toggle('on', on);
    if (on) t.setAttribute('aria-current', 'page'); else t.removeAttribute('aria-current');
  }
  // Röd siffra på Ärenden: deadline idag eller passerad.
  const tab = tabbar.querySelector('[data-view="cases"]'), na = dueNow(S.state, today());
  let bd = tab.querySelector('.tab-badge');
  if (na && !bd) { bd = el('span', { class: 'tab-badge' }); tab.append(bd); }
  if (bd) { bd.hidden = !na; bd.textContent = na > 99 ? '99+' : String(na); }
  tab.setAttribute('aria-label', na ? `Ärenden, ${na} med deadline idag eller passerad` : 'Ärenden');
  syncHistory();
}
/* ---------- Bakåt (som simple-nutrition): flikar och lager i historiken, popstate stänger det översta ---------- */
// Bakåt stänger det översta lagret (nav.js), sedan föregående flik; appen stängs först i startvyn.
// histDepth = open layers that have a history step. A layer that opens gets pushState; one closed by a button goes back
// with history.go(), so no step points at a closed layer. While our own history.go() runs (ownNav) nothing is pushed:
// tab changes wait in pendingView and new layers are pushed when popstate comes.
let histDepth = 0, navTimer = 0, pendingView = null, ownNav = false;
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
  // Leaving Inställningar folds its sections again ('extra' belongs to Ärenden).
  if (view === 'settings' && v !== 'settings') for (const k of [...setOpen]) setOpen.delete(k);
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
    while (layerDepth(S) > target && closeTop(S));
    histDepth = layerDepth(S);
    render();
    return;
  }
  histDepth = target;
  const v = location.hash.slice(1);
  if (Object.hasOwn(VIEWS, v) && v !== view) { S.open = null; S.pick = false; S.trash = false; S.showPwd = false; go(v, false); }
  else syncHistory();   // a stale layer step: go back past it
});
// "Släng" on the button itself (not the close event): two quick closes must never go back twice.
tabbar.addEventListener('click', (ev) => {
  const t = ev.target.closest('[data-view]');
  if (!t) return;
  ev.preventDefault();
  S.open = null; S.pick = false; S.trash = false; S.showPwd = false;
  go(t.dataset.view);
});

// The draft (Nytt ärende) becomes a saved case once it has a title. persist() saves nothing while it is a draft.
function commit() { persist(); }
/* ---------- Actions: one click handler, data-act on the element ---------- */
// 2026-11-18: sorteringsmenyn stängs vid ett tryck utanför den.
document.addEventListener('click', (ev) => { if (S.sortOpen && !ev.target.closest?.('.sort-wrap')) { S.sortOpen = false; ev.stopPropagation(); ev.preventDefault(); render(); } }, true);

/* ---------- Actions: one click handler, data-act on the element ---------- */
const NEEDS_ARCH = new Set(['backupsave', 'import', 'wipe', 'trashopen', 'tempty', 'csv', 'pdel', 'tsave', 'tdel']);
const openCase = (id) => { S.open = id; S.pick = false; render(); scrollTo(0, 0); };
app.addEventListener('click', (ev) => {
  const t = ev.target.closest('[data-act]');
  if (t && !archReady() && NEEDS_ARCH.has(t.dataset.act)) { snackbar('Arkivet läses in – försök igen om en stund', null, null, 2500); return; }
  if (!t || (S.navPending && ev.isTrusted)) return;
  const { act, id } = t.dataset;
  const c = cur();
  const touch = () => { if (c) c.u = today(); };
  switch (act) {
    // Ärenden
    case 'pickopen': {   // Nytt ärende (2026-11-22): öppnas direkt som ett tomt ärende; sparas när det får en rubrik
      if (!roomFor(S.state)) { snackbar(`Högst ${LIM.open} öppna ärenden – markera några som klara först.`, null, null, 4000); return; }
      S.draft = { id: uid(), title: '', c: today(), u: today() }; S.open = S.draft.id; render(); scrollTo(0, 0); document.getElementById('c-title')?.focus(); return;
    }
    case 'cfromtpl': {
      const tpl = S.state.tpls.find((x) => x.id === id); if (!c || c !== S.draft || !tpl) return;
      Object.assign(c, { title: tpl.title, ...(tpl.k ? { k: tpl.k } : {}), ...(tpl.d ? { d: tpl.d } : {}), ...(tpl.s?.length ? { s: tpl.s.map((x) => [x, 0]) } : {}) });
      commit(); break;
    }
    case 'copen': openCase(id); return;
    case 'cclose': S.open = null; S.draft = null; break;
    case 'cdueclr': if (!c) return; delete c.due; touch(); persist(); break;
    case 'cdone': {
      if (!c) return;
      withUndo(`${c.title} är klart – finns i Arkiv`, () => { c.x = today(); touch(); S.open = null; });
      return;
    }
    case 'creopen': if (!c) return; delete c.x; touch(); persist(true); snackbar(`${c.title} är öppet igen`, null, null, 2500); break;
    case 'cdel': {   // to the Papperskorg – can be restored there, so no question first
      if (!c) return;
      if (c === S.draft) { S.draft = null; S.open = null; break; }
      withUndo(`${c.title} flyttat till papperskorgen`, () => { trashCase(S.state, c, today()); S.open = null; });
      return;
    }
    case 'tsave': {   // Spara som mall
      if (!c) return;
      const r = saveTemplate(S.state, c);
      if (!r) { snackbar(`Högst ${LIM.tpls} mallar`, null, null, 3000); return; }
      persist(); snackbar(r.replaced ? `Mallen ${r.tpl.title} uppdaterad` : `Sparad som mall: ${r.tpl.title}`, null, null, 3000); return;
    }
    case 'sadd': {
      const inp = document.getElementById('s-new'), x = cleanText(inp?.value, STEP_CHARS);
      if (!c || !x) { inp?.focus(); return; }
      if ((c.s || []).length >= LIM.steps) { errText('c-error', `Högst ${LIM.steps} delmål.`); return; }
      (c.s ||= []).push([x, 0]); touch(); persist(); render(); document.getElementById('s-new')?.focus(); return;
    }
    case 'sdel': {
      const i = Number(t.dataset.i); if (!c?.s?.[i]) return;
      withUndo(`${c.s[i][0]} togs bort`, () => { c.s.splice(i, 1); if (!c.s.length) delete c.s; touch(); });
      return;
    }
    case 'ladd': {
      const inp = document.getElementById('l-new'), x = cleanText(tidyNote(inp?.value), LOG_CHARS, true);
      if (!c || !x) { inp?.focus(); return; }
      (c.l ||= []).push([today(), x]); if (c.l.length > LIM.log) c.l.shift(); touch(); persist(); break;
    }
    case 'ldel': {
      const i = Number(t.dataset.i); if (!c?.l?.[i]) return;
      withUndo('Anteckningen togs bort', () => { c.l.splice(i, 1); if (!c.l.length) delete c.l; touch(); });
      return;
    }
    case 'amore': S.alimit = (S.alimit || 100) + 100; document.getElementById('arch-list')?.replaceChildren(...[archiveList()].flat().filter(Boolean)); return;
    // Inställningar
    case 'tdel': {
      const tp = S.state.tpls.find((x) => x.id === id); if (!tp) return;
      withUndo(`Mallen ${tp.title} togs bort`, () => { S.state.tpls = S.state.tpls.filter((x) => x !== tp); });
      return;
    }
    case 'ccol': { if (!c) return; if (COLORS.includes(id)) c.k = id; else delete c.k; touch(); persist(); break; }
    case 'pnew': {
      const inp = document.getElementById('p-new'), name = cleanText(inp?.value, 30);
      if (!name || S.state.people.length >= LIM.people) { inp?.focus(); return; }
      S.state.people.push({ id: uid(), name }); persist(); render(); document.getElementById('p-new')?.focus(); return;
    }
    case 'pdel': {   // removing a person clears it from every case (open, archived, trash) – with Ångra
      const p = S.state.people.find((x) => x.id === id); if (!p) return;
      withUndo(`${p.name} togs bort`, () => {
        S.state.people = S.state.people.filter((x) => x !== p);
        for (const x of [...S.state.cases, ...S.state.trash]) if (x.p === p.id) delete x.p;
      });
      persist(true); return;
    }
    case 'trashopen': S.trash = true; render(); scrollTo(0, 0); return;
    case 'trashclose': S.trash = false; break;
    case 'trest': {
      const r = restoreCase(S.state, id);
      if (!r) { snackbar('Kunde inte återställa – för många öppna ärenden', null, null, 3000); return; }
      persist(true); snackbar(r.x ? `${r.title} återställt till Arkiv` : `${r.title} återställt`, null, null, 3000); break;
    }
    case 'tpurge': {
      const x = S.state.trash.find((y) => y.id === id); if (!x) return;
      confirmDelete(`Radera ${x.title}?`, 'Ärendet raderas för gott och kan inte återställas.', () => { S.state.trash = S.state.trash.filter((y) => y !== x); persist(true); render(); });
      return;
    }
    case 'tempty': {
      const n = S.state.trash.length; if (!n) return;
      confirmDelete(`Töm papperskorgen (${n})?`, 'Alla ärenden i papperskorgen raderas för gott.', () => { S.state.trash = []; persist(true); render(); });
      return;
    }
    // Allmänt
    case 'install':
      if (S.installPrompt) { S.installPrompt.prompt(); S.installPrompt.userChoice.finally(() => { S.installPrompt = null; render(); }); }
      return;
    case 'wipe': document.getElementById('confirm-dialog').showModal(); return;
    case 'import': openImport(document.getElementById('import-text').value); return;
    case 'backupsave': saveBackup(); return;
    case 'csv': exportCsv(); return;
    case 'pwdset': rememberPassword(); return;
    case 'pwdcopy': copyPassword(); return;
    case 'pwdown': ownPassword(); return;
    case 'pwdshow': S.showPwd = !S.showPwd; break;
    default: return;
  }
  render();
});
app.addEventListener('input', (ev) => {
  const t = ev.target;
  if (t.id === 'new-title') { S.newTitle = t.value; errText('new-error', ''); return; }
  if (t.id === 'arch-q') { S.q = t.value; document.getElementById('arch-list')?.replaceChildren(...[archiveList()].flat().filter(Boolean)); return; }
  if (t.matches?.('textarea.case-desc, textarea.log-edit')) t.rows = Math.min(14, Math.max(t.classList.contains('case-desc') ? 3 : 1, t.value.split('\n').length + Math.floor(t.value.length / 38)));
});
app.addEventListener('keydown', (ev) => {
  if (ev.key !== 'Enter') return;
  if (ev.target.id === 's-new') { ev.preventDefault(); app.querySelector('[data-act="sadd"]')?.click(); }
  if (ev.target.id === 'p-new') { ev.preventDefault(); app.querySelector('[data-act="pnew"]')?.click(); }
  if (ev.target.id === 'new-title') { ev.preventDefault(); app.querySelector('[data-act="cnew"]')?.click(); }
});
app.addEventListener('toggle', (ev) => {
  const d = ev.target;
  if (d instanceof HTMLDetailsElement && d.dataset.sec) { if (d.open) setOpen.add(d.dataset.sec); else setOpen.delete(d.dataset.sec); }
}, true);
// Fields save when they change (leaving the field). Invalid input → the old value back.
app.addEventListener('change', (ev) => {
  const t = ev.target, c = cur(), touch = () => { c.u = today(); };
  if (t.type === 'date' || t.type === 'time') t.classList.toggle('empty', !t.value);
  switch (t.dataset.act) {
    case 'importfile': if (!archReady()) { t.value = ''; snackbar('Arkivet läses in – försök igen om en stund', null, null, 2500); return; } readBackup(t); return;
    case 'pfilter': S.pfilter = t.value; render(); return;
    case 'kfilter': S.kfilter = t.value; render(); return;
    case 'akfilter': S.akfilter = t.value; S.alimit = 100; render(); return;
    case 'apfilter': S.apfilter = t.value; S.alimit = 100; render(); return;
    case 'ctitle': { if (!c) return; const v = cleanText(t.value, TITLE_CHARS), was = c === S.draft; if (v) { c.title = v; touch(); persist(); if (was) render(); } else t.value = c.title; return; }
    case 'cdesc': {
      if (!c) return; const v = cleanText(tidyNote(t.value), DESC_CHARS, true);
      if (v !== (c.d || '')) { if (v) c.d = v; else delete c.d; touch(); persist(); }
      return;
    }
    case 'cdue': {   // date + optional time; the time waits for a date
      if (!c) return;
      const row = t.closest('.due-row'), d = row.querySelector('.due-date').value, tm = row.querySelector('.due-time').value;
      const v = makeDue(d, tm);
      if (v === false) { errText('c-error', 'Ogiltigt datum eller klockslag.'); return; }
      errText('c-error', '');
      if (v) c.due = v; else delete c.due; touch(); persist(); render(); return;
    }
    case 'cperson': { if (!c) return; if (S.state.people.some((x) => x.id === t.value)) c.p = t.value; else delete c.p; touch(); persist(); return; }
    case 'stog': { const i = Number(t.dataset.i); if (!c?.s?.[i]) return; c.s[i][1] = t.checked ? 1 : 0; touch(); persist(); render(); return; }
    case 'ledit': {   // empty = unchanged (remove with ✕)
      const row = c?.l?.[Number(t.dataset.i)]; if (!row) return;
      const v = cleanText(tidyNote(t.value), LOG_CHARS, true);
      if (v && v !== row[1]) { row[1] = v; touch(); persist(); } else if (!v) t.value = row[1];
      return;
    }
    case 'tname': {
      const tp = S.state.tpls.find((x) => x.id === t.dataset.id), v = cleanText(t.value, TITLE_CHARS);
      if (tp && v) { tp.title = v; persist(); } else if (tp) t.value = tp.title;
      return;
    }
    case 'clabel': {   // what a colour means – shared by every case with that colour
      const k = t.dataset.id; if (!COLORS.includes(k)) return;
      const v = cleanText(t.value, 30); if (v) S.state.labels[k] = v; else delete S.state.labels[k];
      t.value = v; persist(); return;
    }
    case 'pname': {
      const p = S.state.people.find((x) => x.id === t.dataset.id), v = cleanText(t.value, 30);
      if (p && v) { p.name = v; persist(); } else if (p) t.value = p.name;
      return;
    }
    case 'trashdays': { const v = Number(t.value); if (TRASH_DAYS.includes(v)) { S.state.trashDays = v; purgeTrash(S.state, today()); persist(true); render(); } return; }
    case 'lang': self.I18N.setLang(t.value); return;
    case 'bkremind': if (['week', 'month', 'off'].includes(t.value)) { S.state.backup.remind = t.value; S.state.backup.asked = null; persist(); } return;
    default: return;
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

// Start: open cases show at once; the packed archive (closed cases, Papperskorg) is read in the background.
go(location.hash.slice(1), false);
initData({ persist, render, status, snackbar, view: () => view });
setTimeout(() => loadFull(S.state).catch(() => S.state).then((full) => {
  S.state = full; updateOnline();
  purgeTrash(S.state, today());   // Papperskorg: cases past their time are deleted at start
  if (!loadFailed()) persist(true);   // version 20: older data (and its archive) is written in the new form at once
  if (!document.activeElement?.matches?.('input, textarea, select')) render();
  setTimeout(maybeAskBackup, 800);
}), 0);

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.register(window.trustedTypes ? trustedTypes.createPolicy('sw', { createScriptURL: (u) => (u === 'sw.js' ? u : '') }).createScriptURL('sw.js') : 'sw.js', { updateViaCache: 'none' }).catch(() => { /* app still works */ });
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hadController) snackbar('Ny version finns', 'Ladda om', () => location.reload(), 0);
  });
}

// Swipe sideways on the bottom menu → the next/previous view (2026-11-17, same in all apps).
(function navSwipe(nav, item, on) {
  if (!nav) return;
  let t0 = null;
  nav.addEventListener('touchstart', (e) => { const t = e.touches[0]; t0 = e.touches.length === 1 ? { x: t.clientX, y: t.clientY } : null; }, { passive: true });
  nav.addEventListener('touchend', (e) => {
    if (!t0) return;
    const t = e.changedTouches[0], dx = t.clientX - t0.x, dy = t.clientY - t0.y;
    t0 = null;
    if (Math.abs(dx) < 40 || Math.abs(dx) < 1.5 * Math.abs(dy)) return;
    const items = [...nav.querySelectorAll(item)].filter((x) => !x.hidden && x.offsetParent);
    // 2026-11-18: svep i menyn dit du vill gå – åt höger = fliken till höger (som att dra markeringen).
    const next = items[items.findIndex((x) => x.matches(on)) + (dx > 0 ? 1 : -1)];
    if (next) next.click();
  }, { passive: true });
})(document.querySelector('.tabbar'), '.tab', '.on');

// Färgväljaren stängs vid ett tryck utanför den (2026-11-22).
document.addEventListener('click', (ev) => { for (const d of document.querySelectorAll('details.color-pick[open]')) if (!d.contains(ev.target)) d.open = false; });
