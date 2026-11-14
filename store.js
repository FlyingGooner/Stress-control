// Stress kontroll – data model, validation, export/import. ES module; localStorage only (key sk.data). See CLAUDE.md and docs/SPEC.md.
// defaults() → validate(raw) (untrusted → valid, never throws) → load()/save(). Compact: short keys, empty fields left out.
const KEY = 'sk.data';
export const EXPORT_APP = 'stress-kontroll', EXPORT_FORMAT = 1;
export const MAX_IMPORT_CHARS = 2000000;
export const LIM = { cases: 2000, types: 30, cats: 12, fields: 20, steps: 50, log: 200, typeSteps: 10 };
export const COLORS = ['pink', 'green', 'blue', 'orange', 'purple', 'teal', 'red', 'gray'];
export const COLOR_NAMES = { pink: 'Rosa', green: 'Grön', blue: 'Blå', orange: 'Orange', purple: 'Lila', teal: 'Turkos', red: 'Röd', gray: 'Grå' };
export const KINDS = { text: 'Text', note: 'Lång text', date: 'Datum', dt: 'Datum och tid', num: 'Tal', check: 'Bock' };
const ID_RE = /^[A-Za-z0-9_-]{1,40}$/, DATE_RE = /^\d{4}-\d{2}-\d{2}$/, DT_RE = /^(\d{4}-\d{2}-\d{2})T([01]\d|2[0-3]):[0-5]\d$/;
const BAD_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
const okId = (v) => typeof v === 'string' && ID_RE.test(v) && !BAD_KEYS.has(v);

export const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
// Text from data or input: strip control and bidi characters, cut to max length. multi keeps line breaks.
export function cleanText(v, max = 60, multi = false) {
  if (typeof v !== 'string') return '';
  const re = multi ? /[\u0000-\u0009\u000b-\u001f\u007f-\u009f‎‏‪-‮⁦-⁩]/g : /[\u0000-\u001f\u007f-\u009f‎‏‪-‮⁦-⁩]/g;
  return v.replace(/\r\n?/g, '\n').replace(re, '').trim().slice(0, max);
}
const p2 = (n) => String(n).padStart(2, '0');
export const dateKey = (d) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
export function parseKey(k) { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d, 12); }
export function addDays(k, n) { const d = parseKey(k); d.setDate(d.getDate() + n); return dateKey(d); }
export const daysBetween = (a, b) => Math.round((parseKey(b) - parseKey(a)) / 86400000);
export function validDate(k) {
  if (typeof k !== 'string' || !DATE_RE.test(k) || k < '2000-01-01' || k > '2100-12-31') return false;
  return dateKey(parseKey(k)) === k;
}
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

/* ---------- Default categories and case types (fixed ones on, suggestions off – Inställningar) ---------- */
const F = (id, name, kind = 'text') => ({ id, name, kind });
export const DEFAULT_CATS = [
  { id: 'h', name: 'Hälsa', color: 'pink' }, { id: 'e', name: 'Ekonomi', color: 'green' }, { id: 'm', name: 'Hem', color: 'blue' },
  { id: 'j', name: 'Jobb', color: 'orange' }, { id: 'r', name: 'Relationer', color: 'purple' }, { id: 'o', name: 'Övrigt', color: 'gray' },
];
export const DEFAULT_TYPES = [
  { id: 'sym', name: 'Symptom', icon: '🩺', cat: 'h', on: 1,
    fields: [F('s1', 'Symptom'), F('s2', 'Började', 'date'), F('s3', 'Kontaktat vården', 'check'), F('s4', 'Ringde', 'dt'), F('s5', 'Tid hos vården', 'dt'), F('s6', 'Utfall av besök', 'note'), F('s7', 'Slutkommentar', 'note')],
    steps: ['Ring vårdcentralen', 'Gå på besöket', 'Följ upp resultatet'] },
  { id: 'task', name: 'Uppgift', icon: '✅', cat: 'o', on: 1, fields: [F('g', 'Mål', 'note'), F('d', 'Klart senast', 'date')] },
  { id: 'job', name: 'Jobbansökan', icon: '💼', cat: 'j', on: 1,
    fields: [F('co', 'Företag'), F('ro', 'Roll'), F('ap', 'Sökt', 'date'), F('cp', 'Kontaktperson'), F('st', 'Status'), F('iv', 'Intervju', 'dt'), F('pay', 'Lön och villkor'), F('cm', 'Kommentar', 'note')],
    steps: ['Skicka ansökan', 'Följ upp', 'Intervju'] },
  { id: 'eco', name: 'Ekonomi', icon: '💸', cat: 'e', on: 1,
    fields: [F('wh', 'Vad'), F('am', 'Belopp', 'num'), F('du', 'Förfaller', 'date'), F('pd', 'Betalt', 'check'), F('cm', 'Kommentar', 'note')] },
  { id: 'home', name: 'Hemma', icon: '🔧', cat: 'm', on: 1,
    fields: [F('wh', 'Vad'), F('who', 'Vem fixar'), F('d', 'Klart senast', 'date'), F('co', 'Kostnad', 'num'), F('cm', 'Kommentar', 'note')] },
  { id: 'house', name: 'Bostadsköp', icon: '🏠', cat: 'm', on: 0,
    fields: [F('ad', 'Adress'), F('pr', 'Pris', 'num'), F('vw', 'Visning', 'dt'), F('bk', 'Pratat med banken', 'check'), F('ll', 'Lånelöfte', 'check'), F('bid', 'Bud', 'num'), F('th', 'Tankar', 'note')],
    steps: ['Prata med banken', 'Få lånelöfte', 'Gå på visning', 'Lägg bud'] },
  { id: 'dent', name: 'Tandvård', icon: '🦷', cat: 'h', on: 0, fields: [F('wh', 'Vad'), F('bk', 'Bokad tid', 'dt'), F('co', 'Kostnad', 'num'), F('cm', 'Kommentar', 'note')] },
  { id: 'worry', name: 'Oro eller tanke', icon: '🧠', cat: 'h', on: 0,
    fields: [F('wh', 'Vad oroar', 'note'), F('ws', 'Värsta utfall', 'note'), F('lk', 'Troligaste utfall', 'note'), F('can', 'Vad kan jag göra', 'note'), F('rl', 'Släppt', 'check')] },
  { id: 'gov', name: 'Myndighet', icon: '🏛️', cat: 'o', on: 0,
    fields: [F('ag', 'Myndighet'), F('no', 'Ärendenummer'), F('se', 'Skickat', 'date'), F('du', 'Svar senast', 'date'), F('an', 'Svar', 'note')] },
  { id: 'ins', name: 'Försäkring', icon: '🛡️', cat: 'e', on: 0,
    fields: [F('co', 'Bolag'), F('no', 'Skadenummer'), F('rp', 'Anmält', 'date'), F('am', 'Ersättning', 'num'), F('cm', 'Kommentar', 'note')] },
  { id: 'car', name: 'Bil och verkstad', icon: '🚗', cat: 'm', on: 0,
    fields: [F('wh', 'Vad'), F('wk', 'Verkstad'), F('bk', 'Inlämnad', 'date'), F('co', 'Kostnad', 'num'), F('dn', 'Klar', 'check')] },
  { id: 'study', name: 'Studier', icon: '🎓', cat: 'j', on: 0, fields: [F('co', 'Kurs'), F('du', 'Deadline', 'date'), F('gr', 'Betyg'), F('cm', 'Kommentar', 'note')] },
  { id: 'talk', name: 'Samtal att ta', icon: '💬', cat: 'r', on: 0,
    fields: [F('wo', 'Med vem'), F('ab', 'Om vad', 'note'), F('dn', 'Tagit samtalet', 'check'), F('hw', 'Hur gick det', 'note')] },
];
const clone = (x) => JSON.parse(JSON.stringify(x));
export function defaults() {
  return { version: 1, cats: clone(DEFAULT_CATS), types: clone(DEFAULT_TYPES), cases: [], backup: { remind: 'month' } };
}

/* ---------- Validation ---------- */
function cleanCat(c) {
  if (!isObj(c) || !okId(c.id)) return null;
  const name = cleanText(c.name, 30);
  return name ? { id: c.id, name, color: COLORS.includes(c.color) ? c.color : 'gray' } : null;
}
export function cleanType(t, catIds) {
  if (!isObj(t) || !okId(t.id)) return null;
  const name = cleanText(t.name, 30);
  if (!name) return null;
  const seen = new Set();
  const fields = (Array.isArray(t.fields) ? t.fields : []).filter((f) => isObj(f) && okId(f.id) && !seen.has(f.id) && seen.add(f.id) && KINDS[f.kind] && cleanText(f.name, 40))
    .slice(0, LIM.fields).map((f) => ({ id: f.id, name: cleanText(f.name, 40), kind: f.kind }));
  const out = { id: t.id, name, icon: cleanText(t.icon, 8) || '📌', cat: catIds.has(t.cat) ? t.cat : [...catIds][0], on: t.on ? 1 : 0, fields };
  const steps = (Array.isArray(t.steps) ? t.steps : []).map((x) => cleanText(x, 80)).filter(Boolean).slice(0, LIM.typeSteps);
  if (steps.length) out.steps = steps;
  return out;
}
// One field value by kind; undefined = left out.
export function cleanValue(kind, v) {
  switch (kind) {
    case 'text': return cleanText(v, 200) || undefined;
    case 'note': return cleanText(v, 2000, true) || undefined;
    case 'date': return validDate(v) ? v : undefined;
    case 'dt': { const m = typeof v === 'string' && DT_RE.exec(v); return m && validDate(m[1]) ? v : undefined; }
    case 'num': return typeof v === 'number' && Number.isFinite(v) && Math.abs(v) <= 1e9 ? Math.round(v * 100) / 100 : undefined;
    case 'check': return v === 1 || v === true ? 1 : undefined;
    default: return undefined;
  }
}
function cleanCase(c, types) {
  if (!isObj(c) || !okId(c.id) || !validDate(c.c)) return null;
  const type = types.get(c.t), title = cleanText(c.title, 80);
  if (!type || !title) return null;
  const out = { id: c.id, t: c.t, title, c: c.c, u: validDate(c.u) && c.u >= c.c ? c.u : c.c };
  if (validDate(c.x)) out.x = c.x;
  if (isObj(c.f)) {
    const f = {};
    for (const fd of type.fields) { const v = cleanValue(fd.kind, c.f[fd.id]); if (v !== undefined) f[fd.id] = v; }
    if (Object.keys(f).length) out.f = f;
  }
  const s = (Array.isArray(c.s) ? c.s : []).filter((x) => Array.isArray(x) && cleanText(x[0], 80)).slice(0, LIM.steps).map((x) => [cleanText(x[0], 80), x[1] ? 1 : 0]);
  if (s.length) out.s = s;
  const l = (Array.isArray(c.l) ? c.l : []).filter((x) => Array.isArray(x) && validDate(x[0]) && cleanText(x[1], 500, true)).slice(-LIM.log).map((x) => [x[0], cleanText(x[1], 500, true)]);
  if (l.length) out.l = l;
  return out;
}
// Untrusted object → valid state. Invalid parts are skipped, never thrown.
export function validate(raw) {
  const s = defaults();
  if (!isObj(raw)) return s;
  if (Array.isArray(raw.cats)) {
    const seen = new Set();
    const cats = raw.cats.map(cleanCat).filter((c) => c && !seen.has(c.id) && seen.add(c.id)).slice(0, LIM.cats);
    if (cats.length) s.cats = cats;
  }
  const catIds = new Set(s.cats.map((c) => c.id));
  if (Array.isArray(raw.types)) {
    const seen = new Set();
    const types = raw.types.map((t) => cleanType(t, catIds)).filter((t) => t && !seen.has(t.id) && seen.add(t.id)).slice(0, LIM.types);
    if (types.length) s.types = types;
  } else s.types.forEach((t) => { if (!catIds.has(t.cat)) t.cat = s.cats[0].id; });
  const types = new Map(s.types.map((t) => [t.id, t]));
  if (Array.isArray(raw.cases)) {
    const seen = new Set();
    s.cases = raw.cases.map((c) => cleanCase(c, types)).filter((c) => c && !seen.has(c.id) && seen.add(c.id)).slice(0, LIM.cases);
  }
  if (isObj(raw.backup)) {
    if (['week', 'month', 'off'].includes(raw.backup.remind)) s.backup.remind = raw.backup.remind;
    if (validDate(raw.backup.last)) s.backup.last = raw.backup.last;
    if (validDate(raw.backup.asked)) s.backup.asked = raw.backup.asked;
  }
  return s;
}
export function load() {
  try { const t = localStorage.getItem(KEY); return t ? validate(JSON.parse(t)) : defaults(); } catch { return defaults(); }
}
export function save(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); return true; } catch { return false; }
}

/* ---------- Cases ---------- */
export const typeOf = (state, c) => state.types.find((t) => t.id === c.t);
export const catOf = (state, t) => state.cats.find((c) => c.id === t?.cat) || { id: '', name: 'Övrigt', color: 'gray' };
// New case from a type: the type's suggested steps become sub-goals.
export function newCase(state, typeId, title, today) {
  const t = state.types.find((x) => x.id === typeId);
  const name = cleanText(title, 80);
  if (!t || !name || state.cases.length >= LIM.cases) return null;
  const c = { id: uid(), t: t.id, title: name, c: today, u: today };
  if (t.steps?.length) c.s = t.steps.map((x) => [x, 0]);
  state.cases.unshift(c);
  return c;
}
// Sets one field from input text (by the field's kind). Returns false if the input is invalid (nothing changed).
export function setField(state, c, fieldId, input, today) {
  const fd = typeOf(state, c)?.fields.find((f) => f.id === fieldId);
  if (!fd) return false;
  let v;
  if (fd.kind === 'num') { const t = String(input ?? '').replace(/\s/g, '').replace(',', '.'); v = t === '' ? undefined : cleanValue('num', Number(t)); if (t !== '' && v === undefined) return false; }
  else if (fd.kind === 'check') v = input ? 1 : undefined;
  else { v = cleanValue(fd.kind, input); if (v === undefined && String(input ?? '').trim()) return false; }
  const f = { ...(c.f || {}) };
  if (v === undefined) delete f[fd.id]; else f[fd.id] = v;
  if (Object.keys(f).length) c.f = f; else delete c.f;
  c.u = today;
  return true;
}
export const progress = (c) => [(c.s || []).filter((x) => x[1]).length, (c.s || []).length];
export const openCases = (state) => state.cases.filter((c) => !c.x).sort((a, b) => (a.u < b.u ? 1 : a.u > b.u ? -1 : 0));
export const closedCases = (state) => state.cases.filter((c) => c.x).sort((a, b) => (a.x < b.x ? 1 : a.x > b.x ? -1 : 0));
// Överblick: open per category, oldest open, closed in the last 30 days, open sub-goals.
export function overview(state, today) {
  const open = openCases(state), per = new Map(state.cats.map((c) => [c.id, 0]));
  for (const c of open) { const k = typeOf(state, c)?.cat; if (per.has(k)) per.set(k, per.get(k) + 1); }
  const oldest = open.reduce((a, c) => (!a || c.c < a.c ? c : a), null);
  const closed30 = state.cases.filter((c) => c.x && c.x > addDays(today, -30)).length;
  const steps = open.reduce((n, c) => n + (c.s || []).filter((x) => !x[1]).length, 0);
  return { open: open.length, per: state.cats.map((c) => ({ cat: c, n: per.get(c.id) })), oldest, closed30, steps };
}

/* ---------- Export / import (U5, STANDARD 5) ---------- */
// Text → { data, cases, skipped, exported } or { error }. Saves nothing.
export function importText(text) {
  if (typeof text !== 'string' || !text.trim()) return { error: 'Klistra in en exporterad text först.' };
  if (text.length > MAX_IMPORT_CHARS) return { error: 'Texten är för lång (max 2 MB).' };
  let env;
  try { env = JSON.parse(text.replace(/^﻿/, '')); } catch { return { error: 'Texten är inte en giltig export (trasig JSON). Kopiera hela texten igen.' }; }
  if (!isObj(env) || env.app !== EXPORT_APP) return { error: 'Texten kommer inte från Stress kontroll.' };
  if (env.format !== EXPORT_FORMAT) return { error: 'Okänt exportformat – uppdatera appen och försök igen.' };
  if (!isObj(env.data)) return { error: 'Exporten saknar data.' };
  const data = validate(env.data);
  const raw = Array.isArray(env.data.cases) ? env.data.cases.length : 0;
  return { data, cases: data.cases.length, skipped: Math.max(0, raw - data.cases.length),
    exported: typeof env.exported === 'string' && DATE_RE.test(env.exported) ? env.exported : '' };
}
// Every export file describes its own format, so someone else (or an AI) can edit it and import it again.
// Same rules as validate() above – change validate(), change here and in docs/DATA.md.
export const EXPORT_README = 'Backup från Stress kontroll. Ändra bara inom "data". Fältbeskrivningar i "schema", ett minimalt giltigt exempel i "example". Ogiltiga delar hoppas över vid import, inget kraschar. Datum: ÅÅÅÅ-MM-DD, datum och tid: ÅÅÅÅ-MM-DDTHH:MM. id: A–Z a–z 0–9 _ -, högst 40 tecken.';
export const EXPORT_SCHEMA = {
  version: 'tal, 1',
  cats: `lista { id, name ≤ 30, color: ${COLORS.join(' | ')} }, 1–${LIM.cats}`,
  types: `lista { id, name ≤ 30, icon ≤ 8 tecken, cat: kategori-id, on: 0 | 1, fields: [{ id, name ≤ 40, kind: ${Object.keys(KINDS).join(' | ')} }] (≤ ${LIM.fields}), steps?: [text ≤ 80] (≤ ${LIM.typeSteps}) }, 1–${LIM.types}`,
  cases: `lista { id, t: typ-id, title ≤ 80, c: skapad datum, u: ändrad datum, x?: stängd datum, f?: { fält-id: värde efter fältets kind (text ≤ 200, note ≤ 2000, date, dt, num ±1e9, check 1) }, s?: [[delmål ≤ 80, 0 | 1]] (≤ ${LIM.steps}), l?: [[datum, anteckning ≤ 500]] (≤ ${LIM.log}) }, max ${LIM.cases}`,
  backup: '{ remind: "week" | "month" | "off", last?: datum, asked?: datum }',
};
export const EXPORT_EXAMPLE = {
  version: 1,
  cats: [{ id: 'h', name: 'Hälsa', color: 'pink' }],
  types: [{ id: 'sym', name: 'Symptom', icon: '🩺', cat: 'h', on: 1, fields: [{ id: 's1', name: 'Symptom', kind: 'text' }, { id: 's3', name: 'Kontaktat vården', kind: 'check' }] }],
  cases: [{ id: 'c1', t: 'sym', title: 'Ont i knät', c: '2026-11-10', u: '2026-11-12', f: { s1: 'Värk vid trappor', s3: 1 }, s: [['Ring vårdcentralen', 1], ['Gå på besöket', 0]], l: [['2026-11-12', 'Fick tid 18/11']] }],
  backup: { remind: 'month' },
};
export function exportText(state, today) {
  const J = JSON.stringify;
  return `{\n "app": ${J(EXPORT_APP)},\n "format": ${EXPORT_FORMAT},\n "exported": ${J(today)},\n "appVersion": ${J(globalThis.APP_VERSION ?? null)},\n` +
    ` "readme": ${J(EXPORT_README)},\n "schema": ${J(EXPORT_SCHEMA, null, 1).replace(/\n/g, '\n ')},\n "example": ${J(EXPORT_EXAMPLE)},\n "data": ${J(state)}\n}\n`;
}
