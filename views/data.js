// Stress control – export/import, backup-fil och backup-påminnelse (U5). ES-modul, samma mönster som simple-nutrition/views/data.js.
// app.js anropar initData() med sina hjälpfunktioner så att modulen aldrig importerar app.js (bygget stöder inte cirkulära importer).
import { defaults, save, addDays, exportText, importText, MAX_IMPORT_CHARS } from '../store.js';
import { today, S, shortDate, el } from '../ui.js';
const { lang, setLang, chosen: langChosen, LANGS } = self.I18N;

let persist, render, status, snackbar, currentView;
const errText = (id, t) => { const e = document.getElementById(id); if (e) e.textContent = t; };
const $ = (id) => document.getElementById(id);

/* ---------- Export/import (U5) ---------- */
let pendingImport = null;
export function startImport(text) {
  const r = importText(text);
  errText('import-error', '');
  if (r.error) { importError(r.error); return; }
  pendingImport = r.data;
  $('imp-sum').textContent = `${r.cases} trådar` + (r.exported ? `. Exporterad ${r.exported}.` : '.') + (r.skipped ? ` ${r.skipped} ogiltiga hoppas över.` : '');
  $('import-dialog').showModal();
}
const BACKUP_MSG = {
  saved: 'Backup-filen sparades',
  busy: 'Ett sparfönster är redan öppet',
  declined: 'Ingen fil sparades',
  fallback: 'Backup-filen laddas ner',
  error: 'Kunde inte spara filen',
  nocrypto: 'Den här webbläsaren kan inte kryptera – ingen fil sparades',
};
/* ---------- Remembered backup password (optional) ----------
   Kept only on this device under sk.pwd – never in sk.data, so never inside a backup file. The data in localStorage is
   plain anyway; the password protects the file once it leaves the device. Radera all data forgets it too. */
const PWD_KEY = 'sk.pwd', SLUG = 'stress-kontroll';
// 2026-11-15: koden skapas av appen (generatePassword: 16 tecken, kryptografisk slump) och sparas på enheten. Egen kod går att välja (ownPassword), med samma krav.
export function savedPassword() {
  try { let p = localStorage.getItem(PWD_KEY); if (!p) { p = Backup.generatePassword(); localStorage.setItem(PWD_KEY, p); } return p; } catch { return ''; }
}
// Byta kod (2026-11-15): fråga först – gamla backup-filer öppnas bara med den gamla koden. Efteråt: spara en ny backup.
function sureNewCode() {
  const d = document.getElementById('newcode-dialog');
  if (!d || typeof d.showModal !== 'function') return Promise.resolve('ok');
  return new Promise((res) => { d.addEventListener('close', () => res(d.returnValue === 'ok' || d.returnValue === 'save' ? d.returnValue : ''), { once: true }); d.returnValue = ''; d.showModal(); });
}
const afterNewCode = (msg, how) => how === 'save' ? saveBackup() : snackbar(msg + ' Spara en ny backup nu.', 'Spara backup', () => saveBackup(), 10000);
export async function rememberPassword() {
  const how = await sureNewCode(); if (!how) return;
  const p = Backup.generatePassword();
  try { localStorage.setItem(PWD_KEY, p); } catch { snackbar('Kunde inte spara koden', null, null, 3000); return; }
  S.showPwd = true; render();
  afterNewCode('Ny kod skapad.', how);
}
// Egen kod (2026-11-15): samma krav som den skapade (checkPassword: 16+ tecken, stor och liten bokstav, siffra, specialtecken).
export async function ownPassword() {
  const how = await sureNewCode(); if (!how) return;
  const wait = Backup.askPassword('export');   // sets the dialog texts synchronously; ours replace them
  const set = (id, t) => { const n = document.getElementById(id); if (n) n.textContent = t; };
  set('pw-title', 'Välj egen kod'); set('pw-text', 'Koden låser dina backup-filer och sparas på den här enheten.'); set('pw-ok', 'Spara kod');
  const a = await wait; if (!a) return;
  try { localStorage.setItem(PWD_KEY, a.pwd); } catch { snackbar('Kunde inte spara koden', null, null, 3000); return; }
  S.showPwd = false; render();
  afterNewCode('Din egen kod är sparad.', how);
}
export function copyPassword() {
  const p = savedPassword();
  if (!p || !navigator.clipboard) { snackbar('Kunde inte kopiera – tryck Visa och skriv av koden', null, null, 4000); return; }
  navigator.clipboard.writeText(p).then(() => snackbar('Koden är kopierad', null, null, 3000), () => snackbar('Kunde inte kopiera – tryck Visa och skriv av koden', null, null, 4000));
}
// On by default: the password typed in the backup dialog (save or read) is kept, so the question never comes again.
// Off (sk.pwdoff = 1): forgets it and asks every time, as before.
const OFF_KEY = 'sk.pwdoff';
export function rememberOn() { return true; }   // koden sparas alltid (2026-11-15)
export function setRemember(on) {
  try { if (on) localStorage.removeItem(OFF_KEY); else { localStorage.setItem(OFF_KEY, '1'); localStorage.removeItem(PWD_KEY); } } catch { /* blocked */ }
  render();
}
// En backup som lästs in med en annan kod: den koden används sedan (en kod att hålla reda på, t.ex. på en ny telefon).
function keep(pwd) {
  if (!pwd || pwd === savedPassword()) return;
  try { localStorage.setItem(PWD_KEY, pwd); } catch { return; }
  render(); snackbar('Koden från filen används nu för nya backuper.', null, null, 4000);
}
let busy = false;
export async function saveBackup() {
  const pwd = savedPassword();
  let r;
  if (pwd) {   // one tap: encrypt with the remembered password, no dialog
    if (busy) return; busy = true;
    try {
      snackbar('Krypterar backup…', null, null, 2000);
      r = await Backup.save({ slug: SLUG, today: today(), text: await Backup.encrypt(exportText(S.state, today()), pwd, SLUG) });
    } catch { r = 'error'; } finally { busy = false; }
  } else if (!rememberOn()) r = await Backup.saveWithPassword({ slug: SLUG, today: today(), text: exportText(S.state, today()) });
  else {   // first time: the usual dialog, then the password is kept
    if (busy) return; busy = true;
    try {
      const a = await Backup.askPassword('export', async (p) => ({ env: await Backup.encrypt(exportText(S.state, today()), p, SLUG) }));
      if (!a) r = 'cancelled';
      else { keep(a.pwd); r = await Backup.save({ slug: SLUG, today: today(), text: a.value.env }); if (r === 'saved' || r === 'fallback') snackbar('Backup sparad. Lösenordet är sparat på enheten – nästa gång räcker ett tryck.', null, null, 5000); }
    } catch { r = 'error'; } finally { busy = false; }
    if (r === 'saved' || r === 'fallback') { S.state.backup.last = today(); S.state.backup.asked = null; persist(); if (currentView() === 'settings') render(); return; }
  }
  if (r === 'saved' || r === 'fallback') {
    S.state.backup.last = today(); S.state.backup.asked = null; persist();
    if (currentView() === 'settings') render();
  }
  if (BACKUP_MSG[r]) snackbar(BACKUP_MSG[r], null, null, 4000);
}
/* ---------- Backup-påminnelse ---------- */
// Förfallen när det gått en vecka/månad sedan senaste backup (eller sedan första posten). "Inte nu" frågar igen om 3 dagar.
// Visas högst en gång per session, aldrig utan data och aldrig när ett lager eller en dialog är öppen.
let backupAsked = false;
export const hasData = () => S.state.cases.length + S.state.trash.length > 0;
function backupDue() {
  const b = S.state.backup, days = b.remind === 'week' ? 7 : b.remind === 'month' ? 30 : 0;
  if (!days || !hasData()) return false;
  const first = S.state.cases.map((x) => x.c).sort()[0];
  if (addDays(b.last || first, days) > today()) return false;
  return !(b.asked && addDays(b.asked, 3) > today());
}
export function maybeAskBackup() {
  if (backupAsked || S.open || S.pick || S.tedit || document.querySelector('dialog[open]') || !backupDue()) return;
  backupAsked = true;
  const last = S.state.backup.last;
  $('bk-sum').textContent = last
    ? `Senaste backup: ${shortDate(last)}. Spara en ny så att du inte tappar din data.`
    : 'Du har inte sparat någon backup än. Spara en så att du inte tappar din data.';
  $('backup-dialog').showModal();
}
// The error is scrolled into view (in an artifact the page can be taller than the screen).
function importError(msg) {
  errText('import-error', msg);
  try { $('import-error')?.scrollIntoView({ block: 'center' }); } catch { /* old browser */ }
}
export async function readBackup(input) {
  const file = input.files && input.files[0];
  if (!file) return;
  // Read before the field is cleared: some mobile browsers drop access to the chosen file when the input is reset.
  let r;
  try { r = await Backup.read(file, MAX_IMPORT_CHARS); } catch { r = { error: 'Kunde inte läsa filen.' }; }
  input.value = '';
  if (r.error) { importError(r.error); return; }
  openImport(r.text);
}
// Encrypted backup: an envelope asks for the password, then the same checks as plain text.
export async function openImport(text) {
  const pwd = savedPassword();   // the remembered password first; another password → the usual question
  if (pwd && Backup.isEncrypted(text)) {
    let t; try { t = await Backup.decrypt(text, pwd, SLUG, MAX_IMPORT_CHARS); } catch { t = null; }
    if (t && typeof t.text === 'string') { startImport(t.text); noteUnlocked(); return; }
  }
  if (rememberOn() && Backup.isEncrypted(text)) {   // ask, and keep the password that opened the file
    const wait = Backup.askPassword('import', (p) => Backup.decrypt(text, p, SLUG, MAX_IMPORT_CHARS));
    if (pwd) noteWrongSaved();
    const a = await wait;
    if (!a) return;
    if (a.value?.error) { importError(a.value.error); return; }
    keep(a.pwd); startImport(a.value.text); return;
  }
  const r = await Backup.openText(text, SLUG, MAX_IMPORT_CHARS);
  if (r.cancelled) return;
  if (r.error) { importError(r.error); return; }
  startImport(r.text);
}

/* ---------- Välkommen: välj språk och lösenord först (2026-11-14, språk 2026-11-15) ----------
   Lösenordet skapas automatiskt (autoPassword); läses en krypterad backup in i rutan
   ersätter dess lösenord det skapade. Lösenordet är bara nyckeln till backup-filerna – det sparas på enheten (sk.pwd), aldrig i
   datan eller i filen. Bockar man ur Kom ihåg visas rutan inte (man har valt att få frågan varje gång). */
let welcomeDlg = null;
const welcomeHasData = () => S.state.cases.length + S.state.trash.length > 0;
const needsPassword = () => !savedPassword() && rememberOn();   // låst tills ett lösenord är valt, även med data
const needsWelcome = () => !langChosen() || needsPassword();   // språk först (2026-11-15), i samma ruta
function closeWelcome() { if (welcomeDlg?.open && !needsWelcome()) welcomeDlg.close(); }
// Rutan ritas om när språket byts: språkknappar överst, lösenordet under (döljs om det redan är valt).
function fillWelcome() {
  const err = el('p', { class: 'import-error small', role: 'alert' });
  const file = el('input', { type: 'file', accept: '.txt,.json' });
  file.addEventListener('change', async () => {
    const f = file.files && file.files[0]; if (!f) return;
    let r; try { r = await Backup.read(f, MAX_IMPORT_CHARS); } catch { r = { error: 'Kunde inte läsa filen.' }; }
    file.value = '';
    err.textContent = r.error || '';
    if (!r.error) { setLang(lang(), false); openImport(r.text); }
  });
  const cur = lang();
  const segs = el('div', { class: 'segs', role: 'group', 'aria-label': 'Språk' },
    Object.entries(LANGS).map(([k, name]) => {
      const b = el('button', { type: 'button', class: 'seg' + (k === cur ? ' on' : ''), lang: k, 'aria-pressed': String(k === cur), text: name, 'data-no-tr': '' });
      b.addEventListener('click', () => {
        setLang(k);   // laddar om sidan om språket byts; samma språk → bara sparat
        if (!needsWelcome()) welcomeDlg.close(); else fillWelcome();
      });
      return b;
    }));
  welcomeDlg.replaceChildren(...[   // [].filter: replaceChildren writes false as text
    el('h2', { id: 'wl-title', text: 'Välkommen!' }),
    segs,
    el('p', { text: 'Är du ny räcker det att välja språk.' }),
    savedPassword() && el('p', { class: 'muted small', text: 'Din personliga kod (lösenordet till dina backup-filer) har skapats åt dig och finns under Inställningar → Allmänt → Data. Spara den på en säker plats, t.ex. i en lösenordshanterare – utan den går en backup inte att öppna på en ny enhet.' }),
    !welcomeHasData() && el('p', { class: 'muted small', text: 'Har du använt appen förut, på den här eller en annan enhet? Läs in din backup-fil för att få tillbaka din data.' }),
    !welcomeHasData() && el('div', { class: 'welcome-actions' }, el('label', { class: 'btn-file' }, 'Jag har en backup-fil', file)),
    err].filter(Boolean));
}
// 2026-11-15: lösenordet skapas och sparas automatiskt – användaren behöver aldrig välja ett. Visa/Byt under Inställningar.
function autoPassword() {
  if (!needsPassword()) return;
  try { localStorage.setItem(PWD_KEY, Backup.generatePassword()); } catch { /* blocked: asks at the first backup */ }
}
export function welcomeCheck() {
  autoPassword();
  return;   // 2026-11-15: ingen välkomstruta – svenska och lösenordet är förvalda, allt ändras under Inställningar
  if (!needsWelcome() || welcomeDlg?.open || typeof HTMLDialogElement !== 'function') return;
  const other = document.querySelector('dialog[open]');   // t.ex. backup-påminnelsen: fråga när den stängs
  if (other) { other.addEventListener('close', () => setTimeout(welcomeCheck, 0), { once: true }); return; }
  if (!welcomeDlg) {
    welcomeDlg = el('dialog', { class: 'welcome', 'aria-labelledby': 'wl-title' });
    welcomeDlg.addEventListener('cancel', (e) => e.preventDefault());   // inte Esc/Bakåt: språk och lösenord först
    document.body.append(welcomeDlg);
  }
  fillWelcome();
  welcomeDlg.showModal();
}
// Point 2: the user is told when the remembered password opened the file, and when it did not fit.
function noteUnlocked() { const s = document.getElementById('imp-sum'); if (s && document.getElementById('import-dialog')?.open) s.textContent += ' Backupen låstes upp med det sparade lösenordet.'; }
function noteWrongSaved() { const n = document.getElementById('pw-text'); if (n) n.textContent = 'Det sparade lösenordet passade inte till den här filen. Skriv lösenordet du valde när du sparade den.'; }

// Visa lösenord: ett fält räcker (som i KeePass) – Upprepa döljs och följer det första. Görs här, backup.js är delad.
function oneFieldWhenShown() {
  const $id = (id) => document.getElementById(id);
  const dlg = $id('pw-dialog'), show = $id('pw-show'), p1 = $id('pw-1'), p2 = $id('pw-2'), row = $id('pw-2-row'), gen = $id('pw-gen');
  if (!dlg || !show || !p1 || !p2 || !row) return;
  let one = false;   // true while Upprepa is hidden by us (only when saving – reading never shows it)
  const apply = () => {
    if (show.checked && !row.hidden) { one = true; row.hidden = true; p2.value = p1.value; }
    else if (!show.checked && one) { one = false; row.hidden = false; }
  };
  // Sparas lösenordet (Kom ihåg på): påminn om att inte återanvända ett lösenord – det ligger i klartext på enheten.
  const warn = () => { const w = $id('pw-warn'); if (w && !row.hidden && rememberOn() && !w.textContent.includes('annanstans')) w.textContent += (w.textContent ? ' ' : '') + 'Använd ett nytt lösenord som du inte har någon annanstans – det sparas på den här enheten.'; };
  new MutationObserver(() => { if (dlg.open) { one = false; warn(); } }).observe(dlg, { attributes: true, attributeFilter: ['open'] });
  show.addEventListener('change', apply);
  gen?.addEventListener('click', () => setTimeout(apply, 0));   // the generator ticks Visa itself
  p1.addEventListener('input', () => { if (one) p2.value = p1.value; });
}
export function initData(ctx) {
  ({ persist, render, status, snackbar, view: currentView } = ctx);
  $('bk-ok').addEventListener('click', () => { saveBackup(); });
  $('bk-later').addEventListener('click', () => { S.state.backup.asked = today(); persist(); });
  $('imp-ok').addEventListener('click', () => {
    const next = pendingImport;
    pendingImport = null;
    if (!next) return;
    if (!save(next)) { status('Kunde inte spara – lagringen är full eller blockerad. Inget ändrades.', true); return; }
    const before = S.state;
    S.state = next; S.open = null; S.pick = false; S.tedit = null;
    render();
    closeWelcome();
    snackbar('Data importerad', 'Ångra', () => { S.state = before; persist(); render(); });
  });
  $('cd-ok').addEventListener('click', () => {
    S.state = defaults(); S.open = null; S.pick = false; S.tedit = null; try { localStorage.removeItem(PWD_KEY); localStorage.removeItem(OFF_KEY); } catch { /* blocked */ } persist(); render();
    snackbar('All data är raderad', null, null, 3000);
    setTimeout(welcomeCheck, 0);
  });
  oneFieldWhenShown();
  welcomeCheck();
}

/* ---------- CSV (2026-11-15): en rad per tråd, öppna och arkiverade. Inte krypterad. ---------- */
export function exportCsv() {
  const st = S.state, tr = Csv.tr;
  const typ = new Map(st.types.map((t) => [t.id, t])), cat = new Map(st.cats.map((c) => [c.id, c.name])), ppl = new Map(st.people.map((p) => [p.id, p.name]));
  const val = (kind, v) => (v == null ? '' : kind === 'check' ? tr('Ja') : kind === 'days' && Array.isArray(v) ? `${v.length} ${tr('dagar')}` : String(v));
  const rows = st.cases.map((c) => {
    const t = typ.get(c.t) || { name: '', fields: [] };
    const f = [...(t.fields || []).filter((x) => c.f && c.f[x.id] != null).map((x) => `${x.name}: ${val(x.kind, c.f[x.id])}`),
      ...(c.o || []).filter((o) => o[2] != null).map((o) => `${o[0]}: ${val(o[1], o[2])}`)].join(' | ');
    const steps = c.s || [];
    return [c.title, t.name, cat.get(t.cat) || '', c.p ? ppl.get(c.p) || '' : '', c.c, c.u, c.x || '',
      c.r === 'm' ? tr('Varje månad') : c.r === 'y' ? tr('Varje år') : '', steps.filter((x) => x[1]).length, steps.length, f,
      (c.l || []).map((l) => `${l[0]} ${l[1]}`).join(' | ')];
  });
  const text = Csv.build(['Rubrik', 'Typ', 'Kategori', 'Person', 'Skapad', 'Ändrad', 'Stängd', 'Upprepa', 'Delmål klara', 'Delmål totalt', 'Fält', 'Logg'], rows);
  snackbar(Csv.download(`${SLUG}-${today()}.csv`, text) ? 'CSV-filen laddas ner' : 'Kunde inte skapa filen', null, null, 3000);
}
