// Stress kontroll – export/import, backup-fil och backup-påminnelse (U5). ES-modul, samma mönster som simple-nutrition/views/data.js.
// app.js anropar initData() med sina hjälpfunktioner så att modulen aldrig importerar app.js (bygget stöder inte cirkulära importer).
import { defaults, save, addDays, exportText, importText, MAX_IMPORT_CHARS } from '../store.js';
import { today, S, shortDate, el } from '../ui.js';

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
export function savedPassword() { try { const p = localStorage.getItem(PWD_KEY); return p && !Backup.checkPassword(p) ? p : ''; } catch { return ''; } }
export async function rememberPassword() {
  const a = await Backup.askPassword('export'); if (!a) return;
  try { localStorage.setItem(PWD_KEY, a.pwd); } catch { snackbar('Kunde inte spara lösenordet', null, null, 3000); return; }
  render(); snackbar('Lösenordet sparas på den här enheten. Ha det kvar i din lösenordshanterare också.', null, null, 6000);
}
// On by default: the password typed in the backup dialog (save or read) is kept, so the question never comes again.
// Off (sk.pwdoff = 1): forgets it and asks every time, as before.
const OFF_KEY = 'sk.pwdoff';
export function rememberOn() { try { return localStorage.getItem(OFF_KEY) !== '1'; } catch { return false; } }
export function setRemember(on) {
  try { if (on) localStorage.removeItem(OFF_KEY); else { localStorage.setItem(OFF_KEY, '1'); localStorage.removeItem(PWD_KEY); } } catch { /* blocked */ }
  render();
}
function keep(pwd) {
  if (!rememberOn() || Backup.checkPassword(pwd) || savedPassword()) return;   // a password from another file never replaces the saved one
  try { localStorage.setItem(PWD_KEY, pwd); } catch { /* no room: asks next time */ }
  closeWelcome();
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

/* ---------- Välkommen: välj lösenord först (2026-11-14) ----------
   Utan sparat lösenord är appen låst bakom en ruta tills ett lösenord är valt (eller en krypterad backup är inläst,
   vars lösenord sparas), som att registrera sig. Lösenordet är bara nyckeln till backup-filerna – det sparas på enheten (sk.pwd), aldrig i
   datan eller i filen. Bockar man ur Kom ihåg visas rutan inte (man har valt att få frågan varje gång). */
let welcomeDlg = null, importBtn = null;
const welcomeHasData = () => S.state.cases.length + S.state.trash.length > 0;
const needsWelcome = () => !savedPassword() && rememberOn();   // låst tills ett lösenord är valt, även med data
function closeWelcome() { if (welcomeDlg?.open && !needsWelcome()) welcomeDlg.close(); }
export function welcomeCheck() {
  if (!needsWelcome() || welcomeDlg?.open || typeof HTMLDialogElement !== 'function') return;
  const other = document.querySelector('dialog[open]');   // t.ex. backup-påminnelsen: fråga när den stängs
  if (other) { other.addEventListener('close', () => setTimeout(welcomeCheck, 0), { once: true }); return; }
  if (!welcomeDlg) {
    const err = el('p', { class: 'import-error small', role: 'alert' });
    const file = el('input', { type: 'file', accept: '.txt,.json' });
    file.addEventListener('change', async () => {
      const f = file.files && file.files[0]; if (!f) return;
      let r; try { r = await Backup.read(f, MAX_IMPORT_CHARS); } catch { r = { error: 'Kunde inte läsa filen.' }; }
      file.value = '';
      err.textContent = r.error || '';
      if (!r.error) openImport(r.text);
    });
    const pick = el('button', { type: 'button', class: 'btn-file btn-filled', text: 'Välj lösenord' });
    pick.addEventListener('click', choosePassword);
    welcomeDlg = el('dialog', { class: 'welcome', 'aria-labelledby': 'wl-title' },
      el('h2', { id: 'wl-title', text: 'Välkommen!' }),
      el('p', { text: 'Välj ett lösenord för att komma igång och skriv ner det på en säker plats, till exempel i din lösenordshanterare. Dina backup-filer skyddas med lösenordet, och det behövs för att läsa in en backup.' }),
      el('p', { class: 'muted small', text: 'Vi samlar ingen data. Allt stannar på din enhet – lösenordet är bara en nyckel som skyddar dina backuper.' }),
      el('div', { class: 'welcome-actions' }, pick, importBtn = el('label', { class: 'btn-file' }, 'Jag har en backup-fil att importera', file)),
      err);
    welcomeDlg.addEventListener('cancel', (e) => e.preventDefault());   // inte Esc/Bakåt: ett lösenord först
    document.body.append(welcomeDlg);
  }
  importBtn.hidden = !!welcomeHasData();   // har man redan data behövs bara lösenordet
  welcomeDlg.showModal();
}
async function choosePassword() {
  const wait = Backup.askPassword('export');   // sets the dialog texts synchronously; ours replace them
  const set = (id, t) => { const n = document.getElementById(id); if (n) n.textContent = t; };
  set('pw-title', 'Välj lösenord'); set('pw-text', 'Lösenordet krypterar dina backup-filer och sparas på den här enheten.'); set('pw-ok', 'Spara lösenord');
  const a = await wait; if (!a) return;
  keep(a.pwd); render();
  snackbar('Lösenordet är sparat. Backup sparas med ett tryck.', null, null, 4000);
}
// Point 2: the user is told when the remembered password opened the file, and when it did not fit.
function noteUnlocked() { const s = document.getElementById('imp-sum'); if (s && document.getElementById('import-dialog')?.open) s.textContent += ' Backupen låstes upp med det sparade lösenordet.'; }
function noteWrongSaved() { const n = document.getElementById('pw-text'); if (n) n.textContent = 'Det sparade lösenordet passade inte till den här filen. Skriv lösenordet du valde när du sparade den.'; }

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
  welcomeCheck();
}
