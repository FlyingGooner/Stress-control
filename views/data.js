// Stress kontroll – export/import, backup-fil och backup-påminnelse (U5). ES-modul, samma mönster som simple-nutrition/views/data.js.
// app.js anropar initData() med sina hjälpfunktioner så att modulen aldrig importerar app.js (bygget stöder inte cirkulära importer).
import { defaults, save, addDays, exportText, importText, MAX_IMPORT_CHARS } from '../store.js';
import { today, S, shortDate } from '../ui.js';

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
  $('imp-sum').textContent = `${r.cases} ärenden` + (r.exported ? `. Exporterad ${r.exported}.` : '.') + (r.skipped ? ` ${r.skipped} ogiltiga hoppas över.` : '');
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
export async function saveBackup() {
  const r = await Backup.saveWithPassword({ slug: 'stress-kontroll', today: today(), text: exportText(S.state, today()) });
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
export const hasData = () => S.state.cases.length > 0;
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
  const r = await Backup.openText(text, 'stress-kontroll', MAX_IMPORT_CHARS);
  if (r.cancelled) return;
  if (r.error) { importError(r.error); return; }
  startImport(r.text);
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
    snackbar('Data importerad', 'Ångra', () => { S.state = before; persist(); render(); });
  });
  $('cd-ok').addEventListener('click', () => {
    S.state = defaults(); S.open = null; S.pick = false; S.tedit = null; persist(); render();
    snackbar('All data är raderad', null, null, 3000);
  });
}
