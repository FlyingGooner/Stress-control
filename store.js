// Task buddy – data model, validation, export/import. ES module; localStorage only (key sk.data). See CLAUDE.md and docs/DATA.md.
// defaults() → validate(raw) (untrusted → valid, never throws) → load()/save(). Compact: short keys, empty fields left out.
// 2026-11-22 (version 20): omgjord. Ett ärende = rubrik, beskrivning, deadline (datum, ev. tid), person, delmål och logg.
// Mallar (tpls) fungerar som rätterna i Fitness buddy: spara ett ärende som mall, starta nya från den. Inga typer, fält eller kategorier.
const KEY = 'sk.data';
export const EXPORT_APP = 'stress-kontroll', EXPORT_FORMAT = 1;
export const MAX_IMPORT_CHARS = 2000000;
export const VERSION = 22;   // 21: kategorier (cats); 22: bara färg (k = färg) med valfri betydelse (labels)
export const LIM = { cases: 10000, open: 500, trash: 2000, tpls: 100, steps: 100, log: 200, people: 20 };
// Färg (2026-11-22, version 22): ett ärende kan få en av åtta färger. Vad färgen betyder (t.ex. Hem) är valfritt – labels.
export const COLORS = ['pink', 'green', 'blue', 'orange', 'purple', 'teal', 'red', 'gray'];
export const COLOR_NAMES = { pink: 'Rosa', green: 'Grön', blue: 'Blå', orange: 'Orange', purple: 'Lila', teal: 'Turkos', red: 'Röd', gray: 'Grå' };
export const COLOR_DOTS = { pink: '🩷', green: '🟢', blue: '🔵', orange: '🟠', purple: '🟣', teal: '🩵', red: '🔴', gray: '⚪' };
export const TITLE_CHARS = 80, DESC_CHARS = 4000, LOG_CHARS = 2000, STEP_CHARS = 80;
const ID_RE = /^[A-Za-z0-9_-]{1,40}$/, DATE_RE = /^\d{4}-\d{2}-\d{2}$/, DT_RE = /^(\d{4}-\d{2}-\d{2})T([01]\d|2[0-3]):[0-5]\d$/, TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const BAD_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
const okId = (v) => typeof v === 'string' && ID_RE.test(v) && !BAD_KEYS.has(v);

export const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
// Text from data or input: strip control and bidi characters, cut to max length. multi keeps line breaks.
export function cleanText(v, max = 60, multi = false) {
  if (typeof v !== 'string') return '';
  const re = multi ? /[\u0000-\u0009\u000b-\u001f\u007f-\u009f‎‏‪-‮⁦-⁩]/g : /[\u0000-\u001f\u007f-\u009f‎‏‪-‮⁦-⁩]/g;
  return v.replace(/\r\n?/g, '\n').replace(re, '').trim().slice(0, max);
}
// Städa en inklistrad text: mellanslag i radslut bort, flera tomma rader blir en, inga tomma rader först/sist.
export const tidyNote = (v) => (typeof v === 'string' ? v.replace(/\r\n?/g, '\n').replace(/[ \t ]+$/gm, '').replace(/\n{3,}/g, '\n\n').trim() : v);
const longText = (v, max) => cleanText(tidyNote(v), max, true);
const p2 = (n) => String(n).padStart(2, '0');
export const dateKey = (d) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
export function parseKey(k) { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d, 12); }
export function addDays(k, n) { const d = parseKey(k); d.setDate(d.getDate() + n); return dateKey(d); }
// Kalender: månad 'YYYY-MM' flyttad n månader; dagarna i månaden och hur många tomma rutor före den 1:a (veckan börjar måndag).
export function shiftMonth(m, n) { const d = parseKey(m + '-01'); d.setMonth(d.getMonth() + n); return dateKey(d).slice(0, 7); }
export function monthDays(m) {
  const first = m + '-01', d = parseKey(first), len = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  return { lead: (d.getDay() + 6) % 7, days: Array.from({ length: len }, (_, i) => addDays(first, i)) };
}
export const daysBetween = (a, b) => Math.round((parseKey(b) - parseKey(a)) / 86400000);
export function validDate(k) {
  if (typeof k !== 'string' || !DATE_RE.test(k) || k < '2000-01-01' || k > '2100-12-31') return false;
  return dateKey(parseKey(k)) === k;
}
// Deadline: "ÅÅÅÅ-MM-DD" (hela dagen) eller "ÅÅÅÅ-MM-DDTHH:MM".
export function validDue(v) {
  if (validDate(v)) return true;
  const m = typeof v === 'string' && DT_RE.exec(v);
  return !!m && validDate(m[1]);
}
// Date + optional time input → due value, '' = none, false = invalid.
export function makeDue(date, time) {
  if (!date) return '';
  if (!validDate(date)) return false;
  if (!time) return date;
  return TIME_RE.test(time) ? `${date}T${time}` : false;
}
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const clone = (x) => JSON.parse(JSON.stringify(x));

export function defaults() {
  return { version: VERSION, labels: {}, people: [], tpls: [], cases: [], trash: [], trashDays: 30, backup: { remind: 'month' } };
}
// Room for one more open case: max LIM.open open, LIM.cases in all.
export const roomFor = (state) => state.cases.length < LIM.cases && state.cases.filter((c) => !c.x).length < LIM.open;

/* ---------- Validation ---------- */
const cleanSteps = (v) => (Array.isArray(v) ? v : []).filter((x) => Array.isArray(x) && cleanText(x[0], STEP_CHARS)).slice(0, LIM.steps)
  .map((x) => (x[1] ? [cleanText(x[0], STEP_CHARS), 1] : [cleanText(x[0], STEP_CHARS), 0]));
const okColor = (v) => COLORS.includes(v);
function cleanCase(c, people) {
  if (!isObj(c) || !okId(c.id) || !validDate(c.c)) return null;
  const title = cleanText(c.title, TITLE_CHARS);
  if (!title) return null;
  const out = { id: c.id, title, c: c.c, u: validDate(c.u) && c.u >= c.c ? c.u : c.c };
  const d = longText(c.d, DESC_CHARS); if (d) out.d = d;
  if (validDue(c.due)) out.due = c.due;
  if (people.has(c.p)) out.p = c.p;
  if (okColor(c.k)) out.k = c.k;
  const s = cleanSteps(c.s); if (s.length) out.s = s;
  const l = (Array.isArray(c.l) ? c.l : []).filter((x) => Array.isArray(x) && validDate(x[0]) && longText(x[1], LOG_CHARS)).slice(-LIM.log).map((x) => [x[0], longText(x[1], LOG_CHARS)]);
  if (l.length) out.l = l;
  if (validDate(c.x)) out.x = c.x;
  return out;
}
function cleanTpl(t) {
  if (!isObj(t) || !okId(t.id)) return null;
  const title = cleanText(t.title, TITLE_CHARS);
  if (!title) return null;
  const out = { id: t.id, title };
  if (okColor(t.k)) out.k = t.k;
  const d = longText(t.d, DESC_CHARS); if (d) out.d = d;
  const s = (Array.isArray(t.s) ? t.s : []).map((x) => cleanText(x, STEP_CHARS)).filter(Boolean).slice(0, LIM.steps);
  if (s.length) out.s = s;
  return out;
}

/* ---------- Gamla data (version < 20: typer med fält) → nya ärenden ---------- */
// Rubrik, sammanfattning, delmål, logg, person och datum behålls. Ifyllda fält skrivs som rader i beskrivningen.
// Deadline: typens slutdatum (end), annars ett fält markerat som deadline, annars närmaste öppna delmål med datum.
const showOld = (kind, v) => (kind === 'check' ? 'Ja' : kind === 'days' && Array.isArray(v) ? `${v.length} dagar` : kind === 'dt' && typeof v === 'string' ? v.replace('T', ' ') : String(v));
export function migrateCase(c, types) {
  if (!isObj(c)) return c;
  const t = types.get(c.t), f = isObj(c.f) ? c.f : {}, fields = Array.isArray(t?.fields) ? t.fields.filter(isObj) : [];
  const isDate = (fd) => fd.kind === 'date' || fd.kind === 'dt';
  const pick = [...(Array.isArray(t?.end) ? t.end : []).map((id) => fields.find((fd) => fd.id === id)), ...fields.filter((fd) => fd.due)]
    .find((fd) => fd && isDate(fd) && validDue(f[fd.id]));
  let due = pick ? f[pick.id] : '';
  if (!due) due = (Array.isArray(c.s) ? c.s : []).filter((x) => Array.isArray(x) && !x[1] && validDate(x[2])).map((x) => x[2]).sort()[0] || '';
  const lines = [];
  for (const fd of fields) if (fd !== pick && f[fd.id] != null && f[fd.id] !== '') lines.push(`${fd.name}: ${showOld(fd.kind, f[fd.id])}`);
  for (const x of Array.isArray(c.o) ? c.o : []) if (Array.isArray(x) && x[2] != null) lines.push(`${x[0]}: ${showOld(x[1], x[2])}`);
  if (!t) for (const [k, v] of Object.entries(f)) if (v != null && v !== '' && typeof v !== 'object') lines.push(`${k}: ${v === 1 ? 'Ja' : v}`);   // unknown type: nothing is lost
  const d = [typeof c.d === 'string' ? c.d : '', lines.join('\n')].filter((x) => x.trim()).join('\n\n');
  const s = (Array.isArray(c.s) ? c.s : []).filter(Array.isArray).map((x) => [String(x[0] ?? '') + (validDate(x[2]) ? ` (${x[2]})` : ''), x[1] ? 1 : 0]);
  return { id: c.id, title: c.title, c: c.c, u: c.u, x: c.x, p: c.p, k: t?.cat, d, due, s, l: c.l };   // k: the old type's category
}
function migrate(raw) {
  const types = new Map((Array.isArray(raw.types) ? raw.types : []).filter((t) => isObj(t) && okId(t.id)).map((t) => [t.id, t]));
  const cases = (Array.isArray(raw.cases) ? raw.cases : []).map((c) => migrateCase(c, types));
  const trash = (Array.isArray(raw.trash) ? raw.trash : []).map((c) => (isObj(c) ? { ...migrateCase({ ...c, d: '' }, types), del: c.d } : c));   // old trash kept the removed date in d
  return { ...raw, cases, trash, people: (Array.isArray(raw.people) ? raw.people : []).map((p) => (isObj(p) ? { id: p.id, name: p.name } : p)), migrated: 1 };
}

// Version < 22: kategorier { id, name, color } → ärendet får kategorins färg och färgen får kategorins namn (första vinner).
function toColors(raw) {
  const cats = new Map((Array.isArray(raw.cats) ? raw.cats : []).filter((c) => isObj(c) && okColor(c.color)).map((c) => [c.id, c])), labels = {};
  for (const c of cats.values()) { const n = cleanText(c.name, 30); if (n && !labels[c.color]) labels[c.color] = n; }
  const fix = (x) => (isObj(x) ? { ...x, k: cats.get(x.k)?.color } : x);
  return { ...raw, labels, cases: Array.isArray(raw.cases) ? raw.cases.map(fix) : raw.cases, trash: Array.isArray(raw.trash) ? raw.trash.map(fix) : raw.trash, tpls: Array.isArray(raw.tpls) ? raw.tpls.map(fix) : raw.tpls };
}
// Untrusted object → valid state. Invalid parts are skipped, never thrown.
export function validate(raw) {
  const s = defaults();
  if (!isObj(raw)) return s;
  if (!(raw.version >= 20)) raw = migrate(raw);
  if (!(raw.version >= 22)) raw = toColors(raw);
  if (isObj(raw.labels)) for (const k of COLORS) { const v = cleanText(raw.labels[k], 30); if (v) s.labels[k] = v; }
  if (Array.isArray(raw.people)) {
    const seen = new Set();
    s.people = raw.people.filter((x) => isObj(x) && okId(x.id) && cleanText(x.name, 30) && !seen.has(x.id) && seen.add(x.id)).slice(0, LIM.people)
      .map((x) => ({ id: x.id, name: cleanText(x.name, 30) }));
  }
  const people = new Set(s.people.map((x) => x.id));
  if (Array.isArray(raw.tpls)) {
    const seen = new Set();
    s.tpls = raw.tpls.map(cleanTpl).filter((t) => t && !seen.has(t.id) && seen.add(t.id)).slice(0, LIM.tpls);
  }
  if (Array.isArray(raw.cases)) {
    const seen = new Set();
    s.cases = raw.cases.map((c) => cleanCase(c, people)).filter((c) => c && !seen.has(c.id) && seen.add(c.id));
    if (s.cases.length > LIM.cases) {   // over the limit: all open cases stay, the most recently closed fill the rest
      const keep = new Set(s.cases.filter((c) => !c.x).slice(0, LIM.open).map((c) => c.id));
      s.cases.filter((c) => c.x).sort((a, b) => (a.x < b.x ? 1 : -1)).slice(0, LIM.cases - keep.size).forEach((c) => keep.add(c.id));
      s.cases = s.cases.filter((c) => keep.has(c.id));
    }
  }
  if (Array.isArray(raw.trash)) {   // Papperskorg: removed cases with del = removed date; ids never clash with cases
    const seen = new Set(s.cases.map((c) => c.id));
    s.trash = raw.trash.filter((c) => isObj(c) && validDate(c.del)).map((c) => { const x = cleanCase(c, people); if (x) x.del = c.del; return x; })
      .filter((c) => c && !seen.has(c.id) && seen.add(c.id)).slice(-LIM.trash);
  }
  if (TRASH_DAYS.includes(raw.trashDays)) s.trashDays = raw.trashDays;
  if (isObj(raw.backup)) {
    if (['week', 'month', 'off'].includes(raw.backup.remind)) s.backup.remind = raw.backup.remind;
    if (validDate(raw.backup.last)) s.backup.last = raw.backup.last;
    if (validDate(raw.backup.asked)) s.backup.asked = raw.backup.asked;
  }
  return s;
}

// Storage: sk.data holds settings and open cases as plain JSON (fast to write on every change). Closed cases and the
// Papperskorg are packed (deflate-raw, 15 bits per character) into sk.arch, rewritten only when that part changes.
// sk.data without "arch" is a complete state: written first whenever the archive changes, so closing the app while the
// archive is being packed loses nothing. Unreadable data is never overwritten silently: kept under *.broken, loadFailed() says so.
export const BROKEN_KEY = KEY + '.broken';
const ARCH_KEY = 'sk.arch', ARCH_BROKEN = ARCH_KEY + '.broken';
let failed = false, rawRest = null, lastArch = '[[],[]]', lastRef = null, lastSig = '', seq = 0, onSaveError = () => {};
export const loadFailed = () => failed;
export const setSaveErrorHandler = (fn) => { onSaveError = fn; };
// Sync, without the archive: enough to show the app; loadFull() adds the archive.
export function load() {
  let t;
  try { t = localStorage.getItem(KEY); } catch { return defaults(); }
  if (!t) return defaults();
  try { const raw = JSON.parse(t); rawRest = isObj(raw) && raw.arch ? raw : null; archLoaded = !rawRest; return validate(raw); } catch {
    failed = true;
    try { localStorage.setItem(BROKEN_KEY, t); } catch { /* no room: the next save still overwrites, but the user is warned */ }
    return defaults();
  }
}
// The archive is read in the background after the first screen. Until then archReady() is false: save() writes the whole
// (small) state to sk.data with arch: 1, and anything closed or removed meanwhile wins over sk.arch when loaded.
let archLoaded = true;
export const archReady = () => archLoaded;
// Merges the archive into the current state (which may have changed since start). Returns the new state.
export async function loadFull(state) {
  if (!rawRest) { lastArch = ''; lastRef = null; archLoaded = true; return state; }   // sk.data is complete (first start, older version): the first save packs the archive
  let t = null;
  try { t = localStorage.getItem(ARCH_KEY); } catch { /* blocked */ }
  try {
    const u = t ? await unpack(t) : '[[],[]]', a = JSON.parse(u);
    let a0 = Array.isArray(a[0]) ? a[0] : [], a1 = Array.isArray(a[1]) ? a[1] : [];
    if (!(rawRest.version >= 20)) ({ cases: a0, trash: a1 } = migrate({ types: rawRest.types, cases: a0, trash: a1 }));   // version 20: old archive too
    if (!(rawRest.version >= 22)) ({ cases: a0, trash: a1 } = toColors({ cats: rawRest.cats, cases: a0, trash: a1 }));   // version 22: category → colour
    const full = validate({ ...state, cases: [...state.cases, ...a0], trash: [...state.trash, ...a1] });
    lastArch = u; lastRef = null; archLoaded = true; rawRest = null; return full;   // lastArch = what is on disk: extras get packed on the next save
  } catch {
    failed = true;
    try { localStorage.setItem(ARCH_BROKEN, t); } catch { /* no room */ }
    archLoaded = true; rawRest = null; return state;
  }
}
const archText = (state) => JSON.stringify([state.cases.filter((c) => c.x), state.trash]);
const trySet = (k, v) => { try { localStorage.setItem(k, v); return true; } catch { return false; } };
// Returns false if nothing could be written now; a later failure of the packed archive goes to setSaveErrorHandler().
// The archive is only compared (a big JSON) when it may have changed: another state object (import, Ångra), other
// counts in it, or archTouched (the caller edited a closed or removed case in place, or changed types).
const archSig = (state) => { let n = 0, first = ''; for (const c of state.cases) if (c.x) { n++; first ||= c.id; } return `${n}|${first}|${state.trash.length}|${state.trash.at(-1)?.id}`; };
export function save(state, archTouched = false) {
  if (!archLoaded) return trySet(KEY, JSON.stringify({ ...state, arch: 1 }));
  const sig = archSig(state), rest = JSON.stringify({ ...state, cases: state.cases.filter((c) => !c.x), trash: [], arch: 1 });
  if (!archTouched && state === lastRef && sig === lastSig) return trySet(KEY, rest);
  lastRef = state; lastSig = sig;
  const arch = archText(state);
  if (arch === lastArch) return trySet(KEY, rest);
  const my = ++seq, full = trySet(KEY, JSON.stringify(state));
  pack(arch).then((p) => {
    if (my !== seq) return;   // a newer save is on its way
    if (trySet(ARCH_KEY, p) && trySet(KEY, rest)) lastArch = arch;
    else if (!full) onSaveError();
  }, () => { if (!full && my === seq) onSaveError(); });
  return true;
}
// deflate-raw bytes → string, 15 bits per character (0x20–0x801F: no surrogates). "J" = not packed (old browser).
const BITS = 15, OFF = 0x20;
export async function pack(text) {
  if (typeof CompressionStream !== 'function') return 'J' + text;
  const bytes = new Uint8Array(await new Response(new Blob([text]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer());
  let out = 'Z' + bytes.length + ':', acc = 0, bits = 0; const parts = [];
  for (const b of bytes) { acc = (acc << 8) | b; bits += 8; if (bits >= BITS) { bits -= BITS; parts.push(String.fromCharCode(((acc >> bits) & 0x7fff) + OFF)); acc &= (1 << bits) - 1; } }
  if (bits) parts.push(String.fromCharCode(((acc << (BITS - bits)) & 0x7fff) + OFF));
  for (let i = 0; i < parts.length; i += 8192) out += parts.slice(i, i + 8192).join('');
  return out;
}
export async function unpack(t) {
  if (t[0] === 'J') return t.slice(1);
  const m = /^Z(\d+):/.exec(t); if (!m) throw new Error('format');
  const n = Number(m[1]), bytes = new Uint8Array(n); let acc = 0, bits = 0, j = 0;
  for (let i = m[0].length; i < t.length && j < n; i++) { acc = (acc << BITS) | (t.charCodeAt(i) - OFF); bits += BITS; while (bits >= 8 && j < n) { bits -= 8; bytes[j++] = (acc >> bits) & 0xff; } acc &= (1 << bits) - 1; }
  return new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).text();
}
// Storage used by the app, in characters (browsers count localStorage in UTF-16 units; about 5 million per site).
export const STORAGE_QUOTA = 5000000;
export function storageUsed() {
  let n = 0;
  try { for (const k of [KEY, BROKEN_KEY, ARCH_KEY, ARCH_BROKEN]) { const v = localStorage.getItem(k); if (v) n += k.length + v.length; } } catch { /* blocked */ }
  return n;
}
// Rensa arkivet: closed cases archived before the date go to the Papperskorg. Returns how many.
export function trashArchivedBefore(state, date, today) {
  const old = state.cases.filter((c) => c.x && c.x < date);
  for (const c of old) trashCase(state, c, today);
  return old.length;
}


/* ---------- Cases ---------- */
export const personOf = (state, c) => (c.p ? state.people.find((x) => x.id === c.p) : undefined);
// Nytt ärende, ev. från en mall (beskrivning och delmål kopieras). Tom rubrik = mallens rubrik.
export function newCase(state, title, today, tpl = null) {
  const name = cleanText(title, TITLE_CHARS) || tpl?.title || '';
  if (!name || !roomFor(state)) return null;
  const c = { id: uid(), title: name, c: today, u: today };
  if (tpl?.k) c.k = tpl.k;
  if (tpl?.d) c.d = tpl.d;
  if (tpl?.s?.length) c.s = tpl.s.map((x) => [x, 0]);
  state.cases.unshift(c);
  return c;
}
// Spara som mall (som en rätt): rubrik, beskrivning och delmål. Finns en mall med samma rubrik ersätts den.
export function saveTemplate(state, c) {
  const t = cleanTpl({ id: uid(), title: c.title, k: c.k, d: c.d, s: (c.s || []).map((x) => x[0]) });
  if (!t) return null;
  const i = state.tpls.findIndex((x) => x.title.toLowerCase() === t.title.toLowerCase());
  if (i >= 0) { t.id = state.tpls[i].id; state.tpls[i] = t; return { tpl: t, replaced: true }; }
  if (state.tpls.length >= LIM.tpls) return null;
  state.tpls.push(t); state.tpls.sort((a, b) => a.title.localeCompare(b.title, 'sv'));
  return { tpl: t, replaced: false };
}
// Ärendets färg som { color, name } – name är färgens betydelse eller färgens namn.
export const colorName = (state, k) => state.labels[k] || COLOR_NAMES[k];
export const catOf = (state, c) => (okColor(c.k) ? { color: c.k, name: colorName(state, c.k), label: state.labels[c.k] || '' } : undefined);
export const progress = (c) => [(c.s || []).filter((x) => x[1]).length, (c.s || []).length];
// Öppna ärenden: närmast deadline först (passerade överst), utan deadline sist – senast ändrade först.
export const dueDay = (c) => (c.due ? c.due.slice(0, 10) : '');
export const openCases = (state) => state.cases.filter((c) => !c.x).sort((a, b) =>
  (!a.due ? (b.due ? 1 : 0) : !b.due ? -1 : a.due < b.due ? -1 : a.due > b.due ? 1 : 0) || (a.u < b.u ? 1 : a.u > b.u ? -1 : 0));
export const closedCases = (state) => state.cases.filter((c) => c.x).sort((a, b) => (a.x < b.x ? 1 : a.x > b.x ? -1 : 0));
// Passerade eller idag: röd siffra på fliken.
export const dueNow = (state, today) => state.cases.filter((c) => !c.x && c.due && dueDay(c) <= today).length;
// Papperskorg: Ta bort moves a case here; it is deleted for good after trashDays (0 = never).
export const TRASH_DAYS = [7, 30, 90, 365, 0];
export function trashCase(state, c, today) {
  const i = state.cases.indexOf(c); if (i < 0) return false;
  state.cases.splice(i, 1); state.trash.push({ ...c, del: today });
  if (state.trash.length > LIM.trash) state.trash.shift();
  return true;
}
export function restoreCase(state, id) {
  const i = state.trash.findIndex((c) => c.id === id); if (i < 0 || state.cases.length >= LIM.cases || (!state.trash[i].x && !roomFor(state))) return null;
  const [c] = state.trash.splice(i, 1); delete c.del; state.cases.unshift(c); return c;
}
export const purgeDate = (state, c) => (state.trashDays ? addDays(c.del, state.trashDays) : '');
// Removes cases whose time in the trash has run out. Returns how many.
export function purgeTrash(state, today) {
  const n = state.trash.length;
  if (state.trashDays) state.trash = state.trash.filter((c) => purgeDate(state, c) > today);
  return n - state.trash.length;
}

/* ---------- Export / import (U5, STANDARD 5) ---------- */
// Text → { data, cases, skipped, exported } or { error }. Saves nothing.
export function importText(text) {
  if (typeof text !== 'string' || !text.trim()) return { error: 'Klistra in en exporterad text först.' };
  if (text.length > MAX_IMPORT_CHARS) return { error: 'Texten är för lång (max 2 MB).' };
  let env;
  try { env = JSON.parse(text.replace(/^﻿/, '')); } catch { return { error: 'Texten är inte en giltig export (trasig JSON). Kopiera hela texten igen.' }; }
  if (!isObj(env) || env.app !== EXPORT_APP) return { error: 'Texten kommer inte från Task buddy.' };
  if (env.format !== EXPORT_FORMAT) return { error: 'Okänt exportformat – uppdatera appen och försök igen.' };
  if (!isObj(env.data)) return { error: 'Exporten saknar data.' };
  const data = validate(env.data);
  const raw = Array.isArray(env.data.cases) ? env.data.cases.length : 0;
  return { data, cases: data.cases.length, skipped: Math.max(0, raw - data.cases.length),
    exported: typeof env.exported === 'string' && DATE_RE.test(env.exported) ? env.exported : '' };
}
// Every export file describes its own format, so someone else (or an AI) can edit it and import it again.
// Same rules as validate() above – change validate(), change here and in docs/DATA.md.
export const EXPORT_README = 'Backup från Task buddy. Ändra bara inom "data". Fältbeskrivningar i "schema", ett minimalt giltigt exempel i "example". Ogiltiga delar hoppas över vid import, inget kraschar. Datum: ÅÅÅÅ-MM-DD, datum och tid: ÅÅÅÅ-MM-DDTHH:MM. id: A–Z a–z 0–9 _ -, högst 40 tecken.';
export const EXPORT_SCHEMA = {
  version: `tal, ${VERSION} (äldre data med typer och fält görs om vid import: fälten blir rader i beskrivningen)`,
  labels: `vad färgerna betyder, valfritt: { färg: namn ≤ 30 }, färg: ${COLORS.join(' | ')}`,
  people: `lista { id, name ≤ 30 }, ≤ ${LIM.people}: personer som kan utföra ett ärende`,
  tpls: `mallar: lista { id, title ≤ ${TITLE_CHARS}, k?: färg, d?: beskrivning ≤ ${DESC_CHARS}, s?: [delmål ≤ ${STEP_CHARS}] }, ≤ ${LIM.tpls}`,
  cases: `lista { id, title ≤ ${TITLE_CHARS}, c: skapad datum, u: ändrad datum, x?: klart datum (= i arkivet), k?: färg (${COLORS.join(' | ')}), d?: beskrivning ≤ ${DESC_CHARS}, due?: deadline datum eller datum och tid, p?: person-id, s?: [[delmål ≤ ${STEP_CHARS}, 0 | 1]] (≤ ${LIM.steps}), l?: [[datum, anteckning ≤ ${LOG_CHARS}]] (≤ ${LIM.log}) }, max ${LIM.cases} (varav högst ${LIM.open} öppna)`,
  trash: `papperskorg: borttagna ärenden, samma form som cases plus del: borttagen datum, max ${LIM.trash}`,
  trashDays: `dagar i papperskorgen innan ärendet raderas: ${TRASH_DAYS.join(' | ')} (0 = aldrig, standard 30)`,
  backup: '{ remind: "week" | "month" | "off", last?: datum, asked?: datum }',
};
export const EXPORT_EXAMPLE = {
  version: VERSION,
  labels: { blue: 'Hem' },
  people: [{ id: 'p1', name: 'Anna' }],
  tpls: [{ id: 't1', title: 'Boka tandläkare', s: ['Ring', 'Gå dit'] }],
  cases: [{ id: 'c1', title: 'Fixa markisen', k: 'blue', d: 'Klammer i kassetten', due: '2026-12-01T09:00', p: 'p1', c: '2026-11-10', u: '2026-11-12', s: [['Ring firman', 1], ['Boka tid', 0]], l: [['2026-11-12', 'Fick offert']] }],
  backup: { remind: 'month' },
};
export function exportText(state, today) {
  const J = JSON.stringify;
  return `{\n "app": ${J(EXPORT_APP)},\n "format": ${EXPORT_FORMAT},\n "exported": ${J(today)},\n "appVersion": ${J(globalThis.APP_VERSION ?? null)},\n` +
    ` "readme": ${J(EXPORT_README)},\n "schema": ${J(EXPORT_SCHEMA, null, 1).replace(/\n/g, '\n ')},\n "example": ${J(EXPORT_EXAMPLE)},\n "data": ${J(state)}\n}\n`;
}
