// Stress control – data model, validation, export/import. ES module; localStorage only (key sk.data). See CLAUDE.md and docs/SPEC.md.
// defaults() → validate(raw) (untrusted → valid, never throws) → load()/save(). Compact: short keys, empty fields left out.
const KEY = 'sk.data';
export const EXPORT_APP = 'stress-kontroll', EXPORT_FORMAT = 1;
export const MAX_IMPORT_CHARS = 2000000;
export const LIM = { cases: 10000, open: 500, trash: 2000, types: 30, cats: 12, fields: 20, steps: 100, log: 50, logKeep: 200, typeSteps: 10, people: 20, pfields: 20 };   // log: new notes per case; logKeep: older data with more is kept, never cut
export const COLORS = ['pink', 'green', 'blue', 'orange', 'purple', 'teal', 'red', 'gray'];
export const COLOR_NAMES = { pink: 'Rosa', green: 'Grön', blue: 'Blå', orange: 'Orange', purple: 'Lila', teal: 'Turkos', red: 'Röd', gray: 'Grå' };
export const KINDS = { text: 'Text', note: 'Lång text', date: 'Datum', dt: 'Datum och tid', num: 'Tal', check: 'Bock', choice: 'Val i lista', days: 'Dagar (VAB m.m.)' };
// Dagar: [[datum, arbetade timmar 0–24, ansökt 0|1, barn?, vem?]] – a list of days (VAB, föräldrapenning) ticked off one by one.
export const DAYS_MAX = 60, WEEK_HOURS = 40, OPTS_MAX = 30;
// Personer: egenskaper (pfields) are shared by all people, like a type's fields; each person keeps its values in p.v.
// The user renames, reorders, adds and removes them. Kinds: all but days and dt.
export const PERSON_KINDS = ['text', 'note', 'date', 'num', 'check', 'choice'];
export const REL_CHILD = 'Barn';   // a person whose Relation is Barn has no working hours
export const PERSON_FIELDS = [
  { id: 'rel', name: 'Relation', kind: 'choice', opts: ['Jag', 'Partner', 'Barn', 'Förälder', 'Annan'] }, { id: 'born', name: 'Född', kind: 'date' },
  { id: 'tel', name: 'Telefon', kind: 'text' }, { id: 'mail', name: 'E-post', kind: 'text' }, { id: 'work', name: 'Arbetsgivare eller skola', kind: 'text' },
  { id: 'note', name: 'Anteckning', kind: 'note' }];
const OLD_RELS = { me: 'Jag', partner: 'Partner', child: 'Barn', parent: 'Förälder', other: 'Annan' };   // 0.2.52 stored keys, not names
// Försäkringskassan's benefits for private persons (forsakringskassan.se), the most common first. Own choices are added to the type.
export const FK_OPTS = ['VAB (tillfällig föräldrapenning)', 'Föräldrapenning', 'Sjukpenning', 'Sjukersättning', 'Aktivitetsersättning', 'Rehabiliteringspenning',
  'Graviditetspenning', 'Närståendepenning', 'Smittbärarpenning', 'Bostadsbidrag', 'Underhållsstöd', 'Barnbidrag', 'Omvårdnadsbidrag', 'Merkostnadsersättning',
  'Assistansersättning', 'Aktivitetsstöd', 'Bilstöd', 'Arbetsskadeersättning'];
const cleanOpts = (v) => [...new Set((Array.isArray(v) ? v : []).map((x) => cleanText(x, 60)).filter(Boolean))].slice(0, OPTS_MAX);
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
// Städa en inklistrad anteckning (2026-11-18): mellanslag i radslut bort, flera tomma rader blir en, inga tomma rader först/sist.
export const tidyNote = (v) => (typeof v === 'string' ? v.replace(/\r\n?/g, '\n').replace(/[ \t\u00a0]+$/gm, '').replace(/\n{3,}/g, '\n\n').trim() : v);
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
const F = (id, name, kind = 'text', due) => (due ? { id, name, kind, due: 1 } : { id, name, kind });   // due: a deadline – also shown when passed
// if (2026-11-18): fältet visas bara när ett annat fält (ett val) har ett visst värde, t.ex. Pris bara när Köpa eller hyra = Köpa.
const Fi = (cond, ...a) => ({ ...F(...a), if: cond });
// end (2026-11-18): typens slutdatum, i prioritetsordning – det första ifyllda (och synliga) fältet används för sorteringen Datum.
export const END_KINDS = ['date', 'dt', 'days'];
export const endName = (t) => (t?.end || []).map((id) => t.fields.find((f) => f.id === id)?.name).filter(Boolean).join(' / ');
export const shownField = (fd, c) => !fd.if || c?.f?.[fd.if[0]] === fd.if[1];
export const JOB_STATUS = ['Sökt', 'Intervju', 'Erbjudande', 'Nej'];
const HOUSE_FIELDS = [{ id: 'fm', name: 'Köpa eller hyra', kind: 'choice', opts: ['Köpa', 'Hyra'] }, F('ad', 'Adress'),
  Fi(['fm', 'Köpa'], 'pr', 'Pris', 'num'), Fi(['fm', 'Hyra'], 'rt', 'Hyra per månad', 'num'), F('vw', 'Visning', 'dt'),
  Fi(['fm', 'Köpa'], 'bk', 'Pratat med banken', 'check'), Fi(['fm', 'Köpa'], 'll', 'Lånelöfte', 'check'), Fi(['fm', 'Köpa'], 'bid', 'Bud', 'num'),
  Fi(['fm', 'Hyra'], 'q', 'Bostadskö och kötid'), Fi(['fm', 'Hyra'], 'ap', 'Intresseanmälan', 'date'), Fi(['fm', 'Hyra'], 'an', 'Ansök senast', 'dt', 1),
  Fi(['fm', 'Hyra'], 'mi', 'Inflyttning', 'date'), F('th', 'Tankar', 'note')];
export const DEFAULT_CATS = [
  { id: 'h', name: 'Hälsa', color: 'pink' }, { id: 'e', name: 'Ekonomi', color: 'green' }, { id: 'm', name: 'Hem', color: 'blue' },
  { id: 'j', name: 'Jobb', color: 'orange' }, { id: 'r', name: 'Relationer', color: 'purple' }, { id: 's', name: 'Handla', color: 'teal' }, { id: 'o', name: 'Övrigt', color: 'gray' },
];
export const DEFAULT_TYPES = [
  // 2026-11-18 (version 11): färre typer – ett val överst styr fälten (if). Vård = Symptom + Tandvård, Fixa = Hemma + Bil,
  // Ärende = Myndighet + Försäkring, Tankar och samtal = Oro + Samtal.
  { id: 'sym', name: 'Vård', icon: '🩺', cat: 'h', end: ['s5'], on: 1,
    fields: [{ id: 'kd', name: 'Vad gäller det', kind: 'choice', opts: ['Vård', 'Tandvård'] }, F('s1', 'Vad'), F('s2', 'Började', 'date'), F('s3', 'Kontaktat', 'check'),
      F('s5', 'Bokad tid', 'dt'), F('co', 'Kostnad', 'num'), F('s6', 'Utfall', 'note'), F('s7', 'Slutkommentar', 'note')],
    steps: ['Kontakta vården', 'Gå på besöket', 'Följ upp'] },
  { id: 'task', name: 'Uppgift', icon: '✅', cat: 'o', end: ['d'], on: 1, fields: [F('g', 'Mål', 'note'), F('d', 'Klart senast', 'date', 1)] },
  { id: 'job', name: 'Jobbansökan', icon: '💼', cat: 'j', end: ['iv', 'ap'], on: 1,
    fields: [F('co', 'Företag'), F('ro', 'Roll'), F('ap', 'Sökt', 'date'), F('cp', 'Kontaktperson'), { id: 'st', name: 'Status', kind: 'choice', opts: JOB_STATUS },
      F('iv', 'Intervju', 'dt'), F('pay', 'Lön och villkor'), F('cm', 'Kommentar', 'note')],
    steps: ['Skicka ansökan', 'Följ upp', 'Intervju'] },
  { id: 'eco', name: 'Ekonomi', icon: '💸', cat: 'e', end: ['du'], on: 1,
    fields: [F('wh', 'Vad'), F('am', 'Belopp', 'num'), F('du', 'Förfaller', 'date', 1), F('pd', 'Betalt', 'check'), F('cm', 'Kommentar', 'note')] },
  { id: 'home', name: 'Fixa', icon: '🔧', cat: 'm', end: ['d', 'bk'], on: 1,
    fields: [{ id: 'kd', name: 'Var', kind: 'choice', opts: ['Hemma', 'Bil'] }, F('wh', 'Vad'), Fi(['kd', 'Hemma'], 'who', 'Vem fixar'), Fi(['kd', 'Bil'], 'wk', 'Verkstad'),
      Fi(['kd', 'Bil'], 'bk', 'Inlämnad', 'date'), F('d', 'Klart senast', 'date', 1), F('co', 'Kostnad', 'num'), F('dn', 'Klar', 'check'), F('cm', 'Kommentar', 'note')] },
  { id: 'shop', name: 'Inköp', icon: '🛒', cat: 's', end: ['d'], on: 1, r: 'w',   // r: new cases repeat weekly; sub-goals are the items
    fields: [F('st', 'Butik'), F('d', 'Handla senast', 'date', 1), F('co', 'Kostnad', 'num')] },
  { id: 'house', name: 'Ny bostad', icon: '🏠', cat: 'm', end: ['an', 'vw'], on: 0, fields: HOUSE_FIELDS,   // 2026-11-18: köpa eller hyra (tidigare Bostadsköp)
    steps: ['Gå på visning', 'Lägg bud eller skicka intresseanmälan', 'Skriv kontrakt'] },
  { id: 'fk', name: 'Försäkringskassan', icon: '🛟', cat: 'e', end: ['dy'], on: 1,
    fields: [{ id: 'wh', name: 'Vad', kind: 'choice', opts: FK_OPTS }, F('dy', 'Dagar', 'days'), F('cm', 'Kommentar', 'note')] },
  { id: 'gov', name: 'Ärende', icon: '🏛️', cat: 'o', end: ['du', 'se'], on: 0,
    fields: [{ id: 'kd', name: 'Hos', kind: 'choice', opts: ['Myndighet', 'Försäkringsbolag'] }, Fi(['kd', 'Myndighet'], 'ag', 'Myndighet'), Fi(['kd', 'Försäkringsbolag'], 'co', 'Bolag'),
      F('no', 'Ärendenummer'), F('se', 'Skickat', 'date'), F('du', 'Svar senast', 'date', 1), F('am', 'Ersättning', 'num'), F('an', 'Svar', 'note')] },
  { id: 'study', name: 'Studier', icon: '🎓', cat: 'j', end: ['du'], on: 0, fields: [F('co', 'Kurs'), F('du', 'Deadline', 'date', 1), F('gr', 'Betyg'), F('cm', 'Kommentar', 'note')] },
  { id: 'worry', name: 'Tankar och samtal', icon: '🧠', cat: 'r', on: 0,
    fields: [{ id: 'kd', name: 'Vad', kind: 'choice', opts: ['Oro', 'Samtal'] },
      Fi(['kd', 'Oro'], 'wh', 'Vad oroar', 'note'), Fi(['kd', 'Oro'], 'ws', 'Värsta utfall', 'note'), Fi(['kd', 'Oro'], 'lk', 'Troligaste utfall', 'note'), Fi(['kd', 'Oro'], 'can', 'Vad kan jag göra', 'note'), Fi(['kd', 'Oro'], 'rl', 'Släppt', 'check'),
      Fi(['kd', 'Samtal'], 'wo', 'Med vem'), Fi(['kd', 'Samtal'], 'ab', 'Om vad', 'note'), Fi(['kd', 'Samtal'], 'dn', 'Tagit samtalet', 'check'), Fi(['kd', 'Samtal'], 'hw', 'Hur gick det', 'note')] },
];
// Room for one more open case: max LIM.open open, LIM.cases in all.
export const roomFor = (state) => state.cases.length < LIM.cases && state.cases.filter((c) => !c.x).length < LIM.open;
const clone = (x) => JSON.parse(JSON.stringify(x));
export function defaults() {
  return { version: 12, pfields: clone(PERSON_FIELDS), people: [], cats: clone(DEFAULT_CATS), types: clone(DEFAULT_TYPES), cases: [], trash: [], trashDays: 30, alertDays: 7, backup: { remind: 'month' } };
}

/* ---------- Validation ---------- */
function cleanCat(c) {
  if (!isObj(c) || !okId(c.id)) return null;
  const name = cleanText(c.name, 30);
  return name ? { id: c.id, name, color: COLORS.includes(c.color) ? c.color : 'gray' } : null;
}
export function cleanFields(list, kinds, max) {
  const seen = new Set();
  return (Array.isArray(list) ? list : []).filter((f) => isObj(f) && okId(f.id) && !seen.has(f.id) && seen.add(f.id) && kinds.includes(f.kind) && cleanText(f.name, 40))
    .slice(0, max).map((f) => ({ id: f.id, name: cleanText(f.name, 40), kind: f.kind, ...(f.due && (f.kind === 'date' || f.kind === 'dt') ? { due: 1 } : {}), ...(f.kind === 'choice' ? { opts: cleanOpts(f.opts) } : {}),
      ...(Array.isArray(f.if) && okId(f.if[0]) && f.if[0] !== f.id && cleanText(f.if[1], 60) ? { if: [f.if[0], cleanText(f.if[1], 60)] } : {}) }));
}
export function cleanType(t, catIds) {
  if (!isObj(t) || !okId(t.id)) return null;
  const name = cleanText(t.name, 30);
  if (!name) return null;
  const fields = cleanFields(t.fields, Object.keys(KINDS), LIM.fields);
  const out = { id: t.id, name, icon: cleanText(t.icon, 8) || '📌', cat: catIds.has(t.cat) ? t.cat : [...catIds][0], on: t.on ? 1 : 0, fields };
  if (REPEAT[t.r]) out.r = t.r;   // new cases of this type repeat
  const end = (Array.isArray(t.end) ? t.end : []).filter((id, i, a) => a.indexOf(id) === i && fields.some((f) => f.id === id && END_KINDS.includes(f.kind))).slice(0, 4);
  if (end.length) out.end = end;
  const steps = (Array.isArray(t.steps) ? t.steps : []).map((x) => cleanText(x, 80)).filter(Boolean).slice(0, LIM.typeSteps);
  if (steps.length) out.steps = steps;
  return out;
}
// One field value by kind; undefined = left out.
export function cleanValue(kind, v) {
  switch (kind) {
    case 'text': return cleanText(v, 200) || undefined;
    case 'choice': return cleanText(v, 60) || undefined;
    case 'note': return cleanText(v, 2000, true) || undefined;
    case 'date': return validDate(v) ? v : undefined;
    case 'dt': { const m = typeof v === 'string' && DT_RE.exec(v); return m && validDate(m[1]) ? v : undefined; }
    case 'num': return typeof v === 'number' && Number.isFinite(v) && Math.abs(v) <= 1e9 ? Math.round(v * 100) / 100 : undefined;
    case 'check': return v === 1 || v === true ? 1 : undefined;
    case 'days': {   // sorted by date, one row per date
      if (!Array.isArray(v)) return undefined;
      const seen = new Set(), key = (x) => x[0] + '|' + (okId(x[4]) ? x[4] : '');   // one row per date and person
      const out = v.filter((x) => Array.isArray(x) && validDate(x[0]) && !seen.has(key(x)) && seen.add(key(x))).slice(0, DAYS_MAX)
        .map(([d, w, a, k, p]) => { const r = [d, typeof w === 'number' && w > 0 && w <= 24 ? Math.round(w * 100) / 100 : 0, a ? 1 : 0]; if (okId(k) || okId(p)) r.push(okId(k) ? k : 0); if (okId(p)) r.push(p); return r; }).sort((a, b) => (a[0] < b[0] ? -1 : 1));
      return out.length ? out : undefined;
    }
    default: return undefined;
  }
}
function cleanCase(c, types, people) {
  if (!isObj(c) || !okId(c.id) || !validDate(c.c)) return null;
  const type = types.get(c.t), title = cleanText(c.title, 80);
  if (!type || !title) return null;
  const out = { id: c.id, t: c.t, title, c: c.c, u: validDate(c.u) && c.u >= c.c ? c.u : c.c };
  if (validDate(c.x)) out.x = c.x;
  if (REPEAT[c.r]) out.r = c.r;
  if (people?.has(c.p)) out.p = c.p;
  if (isObj(c.f)) {
    const f = {};
    for (const fd of type.fields) { const v = cleanValue(fd.kind, c.f[fd.id]); if (v !== undefined) f[fd.id] = v; }
    if (Object.keys(f).length) out.f = f;
  }
  const o = (Array.isArray(c.o) ? c.o : []).filter((x) => Array.isArray(x) && Object.hasOwn(KINDS, x[1]) && cleanText(x[0], 40)).slice(0, LIM.fields)
    .map((x) => [cleanText(x[0], 40), x[1], cleanValue(x[1], x[2]) ?? null, cleanText(x[3], 30)]);
  if (o.length) out.o = o;
  const s = (Array.isArray(c.s) ? c.s : []).filter((x) => Array.isArray(x) && cleanText(x[0], 80)).slice(0, LIM.steps).map((x) => cleanStep(x[0], x[1], x[2], x[3], x[4]));
  if (s.length) out.s = s;
  const l = (Array.isArray(c.l) ? c.l : []).filter((x) => Array.isArray(x) && validDate(x[0]) && cleanText(x[1], 500, true)).slice(-LIM.logKeep).map((x) => [x[0], cleanText(tidyNote(x[1]), 500, true)]);
  if (l.length) out.l = l;
  return out;
}
// Version 11 (2026-11-18): fyra par typer slogs ihop. Trådar flyttas till den nya typen med valet satt (kd) och fälten
// omdöpta; typerna blir de nya standardtyperna, plus fält som användaren själv lagt till. Arbetar på en kopia av rådata.
const MERGE11 = [
  { to: 'sym', from: 'dent', kdTo: 'Vård', kdFrom: 'Tandvård', map: { wh: 's1', bk: 's5', cm: 's7' } },
  { to: 'home', from: 'car', kdTo: 'Hemma', kdFrom: 'Bil', map: {} },
  { to: 'gov', from: 'ins', kdTo: 'Myndighet', kdFrom: 'Försäkringsbolag', map: { rp: 'se', cm: 'an' } },
  { to: 'worry', from: 'talk', kdTo: 'Oro', kdFrom: 'Samtal', map: {} },
];
function merge11(raw0) {
  let raw; try { raw = JSON.parse(JSON.stringify(raw0)); } catch { return raw0; }
  if (!Array.isArray(raw.types)) return raw;
  const byId = new Map(raw.types.filter(isObj).map((t) => [t.id, t]));
  const fixCase = (c) => {
    if (!isObj(c)) return;
    const m = MERGE11.find((x) => x.from === c.t || x.to === c.t);
    if (m && byId.has(m.to) || m && byId.has(m.from)) {
      const f = isObj(c.f) ? c.f : {};
      if (c.t === m.from) { for (const [a, b] of Object.entries(m.map)) if (a in f) { f[b] = f[a]; delete f[a]; } f.kd = m.kdFrom; c.t = m.to; }
      else if (!f.kd) f.kd = m.kdTo;
      c.f = f;
    }
    if (c.t === 'job' && isObj(c.f) && typeof c.f.st === 'string') c.f.st = c.f.st.slice(0, 60);
  };
  (Array.isArray(raw.cases) ? raw.cases : []).forEach(fixCase);
  (Array.isArray(raw.trash) ? raw.trash : []).forEach(fixCase);
  for (const m of MERGE11) {
    const a = byId.get(m.to), b = byId.get(m.from);
    if (!a && !b) continue;
    const def = clone(DEFAULT_TYPES.find((t) => t.id === m.to)), known = new Set(def.fields.map((f) => f.id));
    const oldIds = new Set([...Object.keys(m.map), ...Object.values(m.map)]);
    for (const t of [a, b]) for (const f of (t && Array.isArray(t.fields) ? t.fields : [])) if (isObj(f) && !known.has(f.id) && !oldIds.has(f.id)) { def.fields.push(f); known.add(f.id); }
    def.on = (a?.on || b?.on) ? 1 : 0;
    if (a && isObj(a)) { if (a.cat) def.cat = a.cat; Object.keys(a).forEach((k) => delete a[k]); Object.assign(a, def); }
    else raw.types.push(def);
    if (b) raw.types = raw.types.filter((t) => t !== b);
  }
  for (const t of raw.types) if (isObj(t) && t.id === 'job' && Array.isArray(t.fields)) for (const f of t.fields) if (isObj(f) && f.id === 'st' && f.kind === 'text') { f.kind = 'choice'; f.opts = [...JOB_STATUS]; }
  return raw;
}
// Untrusted object → valid state. Invalid parts are skipped, never thrown.
export function validate(raw) {
  const s = defaults();
  if (!isObj(raw)) return s;
  if (!(raw.version >= 11)) raw = merge11(raw);
  if (Array.isArray(raw.cats)) {
    const seen = new Set();
    const cats = raw.cats.map(cleanCat).filter((c) => c && !seen.has(c.id) && seen.add(c.id)).slice(0, LIM.cats);
    if (cats.length) s.cats = cats;
    if (!(raw.version >= 7) && !s.cats.some((c) => c.id === 's') && s.cats.length < LIM.cats) { const o = s.cats.findIndex((c) => c.id === 'o'); s.cats.splice(o < 0 ? s.cats.length : o, 0, clone(DEFAULT_CATS.find((c) => c.id === 's'))); }   // version 7: Handla
  }
  const catIds = new Set(s.cats.map((c) => c.id));
  if (Array.isArray(raw.types)) {
    const seen = new Set();
    const types = raw.types.map((t) => cleanType(t, catIds)).filter((t) => t && !seen.has(t.id) && seen.add(t.id)).slice(0, LIM.types);
    if (types.length) s.types = types;
    if (!(raw.version >= 3) && !s.types.some((t) => t.id === 'fk') && s.types.length < LIM.types) s.types.push(cleanType(clone(DEFAULT_TYPES.find((t) => t.id === 'fk')), catIds));   // new default type in version 3
    if (!(raw.version >= 7) && !s.types.some((t) => t.id === 'shop') && s.types.length < LIM.types) s.types.push(cleanType(clone(DEFAULT_TYPES.find((t) => t.id === 'shop')), catIds));   // version 7: Inköp
    if (!(raw.version >= 5)) for (const t of s.types) {   // version 5: Försäkringskassan's Vad became a list of benefits
      const f = t.id === 'fk' && t.fields.find((x) => x.id === 'wh' && x.kind === 'text');
      if (f) { f.kind = 'choice'; f.opts = [...FK_OPTS]; }
    }
    if (!(raw.version >= 8)) for (const t of s.types) if (t.id === 'house') {   // version 8: Bostadsköp → Ny bostad, köpa eller hyra
      if (t.name === 'Bostadsköp') t.name = 'Ny bostad';
      const ids = new Set(t.fields.map((f) => f.id));
      for (const f of t.fields) { const d = HOUSE_FIELDS.find((x) => x.id === f.id && x.if); if (d && !f.if) f.if = [...d.if]; }
      const add = HOUSE_FIELDS.filter((x) => !ids.has(x.id)).map(clone);
      if (add.some((x) => x.id === 'fm')) t.fields.unshift(add.shift());
      t.fields.push(...add.filter((x) => x.id !== 'fm'));
      t.fields = t.fields.slice(0, LIM.fields);
    }
    if (!(raw.version >= 9)) for (const t of s.types) if (t.id === 'house') for (const f of t.fields) if (f.id === 'an' && f.kind === 'date') f.kind = 'dt';   // version 9: Svara senast med tid
    if (!(raw.version >= 10)) for (const t of s.types) if (t.id === 'house') {   // version 10: Ansök senast, fälten i standardordning
      for (const f of t.fields) if (f.id === 'an' && f.name === 'Svara senast') f.name = 'Ansök senast';
      const pos = (f) => { const i = HOUSE_FIELDS.findIndex((x) => x.id === f.id); return i < 0 ? 999 : i; };
      t.fields = t.fields.map((f, i) => [f, i]).sort((a, b) => pos(a[0]) - pos(b[0]) || a[1] - b[1]).map(([f]) => f);
    }
    if (!(raw.version >= 12)) for (const t of s.types) if (!t.end) {   // version 12: slutdatum per typ
      const def = DEFAULT_TYPES.find((x) => x.id === t.id)?.end?.filter((id) => t.fields.some((f) => f.id === id && END_KINDS.includes(f.kind)));
      if (def?.length) t.end = [...def];
    }
    if (!(raw.version >= 4)) for (const t of s.types) if (t.id === 'fk' && t.icon === '👶') t.icon = '🛟';   // 0.2.47 had a baby icon – not only about children
    if (!(raw.version >= 2)) for (const t of s.types) {   // version 1 had no deadlines: mark the default ones
      const d = DEFAULT_TYPES.find((x) => x.id === t.id);
      for (const f of t.fields) if (d?.fields.some((g) => g.id === f.id && g.due && g.kind === f.kind)) f.due = 1;
    }
  } else s.types.forEach((t) => { if (!catIds.has(t.cat)) t.cat = s.cats[0].id; });
  const types = new Map(s.types.map((t) => [t.id, t]));
  if (Array.isArray(raw.pfields)) s.pfields = cleanFields(raw.pfields, PERSON_KINDS, LIM.pfields);
  if (Array.isArray(raw.people)) {   // Personer: who does a case (case.p)
    const seen = new Set();
    s.people = raw.people.filter((x) => isObj(x) && okId(x.id) && cleanText(x.name, 30) && !seen.has(x.id) && seen.add(x.id)).slice(0, LIM.people).map((x) => {
      const p = { id: x.id, name: cleanText(x.name, 30) };
      if (typeof x.h === 'number' && x.h >= 1 && x.h <= 80 && x.h !== WEEK_HOURS) p.h = Math.round(x.h * 10) / 10;
      const raw = isObj(x.v) ? x.v : { ...x, rel: OLD_RELS[x.rel] ?? x.rel };   // 0.2.52 kept details on the person itself
      const v = {};
      for (const f of s.pfields) { const y = cleanValue(f.kind, raw[f.id]); if (y !== undefined) v[f.id] = y; }
      if (Object.keys(v).length) p.v = v;
      return p;
    });
  }
  const people = new Set(s.people.map((x) => x.id));
  if (Array.isArray(raw.cases)) {
    const seen = new Set();
    // version 9: Svara senast fick klockslag – ett gammalt datum blir dagens slut (23:59).
    const v9 = (c) => (!(raw.version >= 9) && isObj(c) && c.t === 'house' && isObj(c.f) && validDate(c.f.an) ? { ...c, f: { ...c.f, an: c.f.an + 'T23:59' } } : c);
    s.cases = raw.cases.map((c) => cleanCase(v9(c), types, people)).filter((c) => c && !seen.has(c.id) && seen.add(c.id));
    if (!(raw.version >= 8) && s.types.some((t) => t.id === 'house' && t.fields.some((f) => f.id === 'fm')))   // gamla bostadsköp är köp
      for (const c of s.cases) if (c.t === 'house' && !c.f?.fm) (c.f ||= {}).fm = 'Köpa';
    if (s.cases.length > LIM.cases) {   // over the limit: all open cases stay, the most recently closed fill the rest
      const keep = new Set(s.cases.filter((c) => !c.x).slice(0, LIM.open).map((c) => c.id));
      s.cases.filter((c) => c.x).sort((a, b) => (a.x < b.x ? 1 : -1)).slice(0, LIM.cases - keep.size).forEach((c) => keep.add(c.id));
      s.cases = s.cases.filter((c) => keep.has(c.id));
    }
  }
  if (Array.isArray(raw.trash)) {   // Papperskorg: removed cases with d = removed date; ids never clash with cases
    const seen = new Set(s.cases.map((c) => c.id));
    s.trash = raw.trash.filter((c) => isObj(c) && validDate(c.d)).map((c) => { const x = cleanCase(c, types, people); if (x) x.d = c.d; return x; })
      .filter((c) => c && !seen.has(c.id) && seen.add(c.id)).slice(-LIM.trash);
  }
  if (TRASH_DAYS.includes(raw.trashDays)) s.trashDays = raw.trashDays;
  if (ALERT_DAYS.includes(raw.alertDays)) s.alertDays = raw.alertDays;
  if (isObj(raw.sort)) for (const k of Object.keys(SORTS)) if (validSort(k, raw.sort[k])) (s.sort ||= {})[k] = raw.sort[k];
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
    const full = validate({ ...state, cases: [...state.cases, ...(Array.isArray(a[0]) ? a[0] : [])], trash: [...state.trash, ...(Array.isArray(a[1]) ? a[1] : [])] });
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
export const childrenOf = (state) => state.people.filter((x) => x.v?.rel === REL_CHILD);   // Relation = Barn
export const personOf = (state, c) => (c.p ? state.people.find((x) => x.id === c.p) : undefined);
export const typeOf = (state, c) => state.types.find((t) => t.id === c.t);
export const catOf = (state, t) => state.cats.find((c) => c.id === t?.cat) || { id: '', name: 'Övrigt', color: 'gray' };
// New case from a type: the type's suggested steps become sub-goals.
export function newCase(state, typeId, title, today) {
  const t = state.types.find((x) => x.id === typeId);
  const name = cleanText(title, 80);
  if (!t || !name || !roomFor(state)) return null;
  const c = { id: uid(), t: t.id, title: name, c: today, u: today };
  if (t.steps?.length) c.s = t.steps.map((x) => [x, 0]);
  if (REPEAT[t.r]) c.r = t.r;
  state.cases.unshift(c);
  return c;
}
// Input text → value by kind; undefined = empty, false = invalid.
export function parseInput(kind, input) {
  if (kind === 'num') { const t = String(input ?? '').replace(/\s/g, '').replace(',', '.'); if (t === '') return undefined; const v = cleanValue('num', Number(t)); return v === undefined ? false : v; }
  if (kind === 'check') return input ? 1 : undefined;
  const v = cleanValue(kind, input); return v === undefined && String(input ?? '').trim() ? false : v;
}
// Extra fields only in this case (c.o: [name, kind, value|null, from-type?]) – added by hand or left from an earlier type.
export function addExtra(c, name, kind, today) {
  const n = cleanText(name, 40);
  if (!n || !Object.hasOwn(KINDS, kind) || kind === 'days' || kind === 'choice' || (c.o || []).length >= LIM.fields || (c.o || []).some((x) => x[0] === n)) return false;
  (c.o ||= []).push([n, kind, null, '']); c.u = today; return true;
}
export function setExtra(c, i, input, today) {
  const x = c.o?.[i]; if (!x) return false;
  const v = parseInput(x[1], input); if (v === false) return false;
  x[2] = v === undefined ? null : v; c.u = today; return true;
}
// Sets one field from input text (by the field's kind). Returns false if the input is invalid (nothing changed).
// Dagar: normal hours per day from the case's person (h = hours per week, default 40, 5 days a week).
// A day row may name its own person (x[4], who stayed home); p = that person's id, else the case's person.
export const dayPerson = (state, c, p) => (p && state.people.find((x) => x.id === p)) || personOf(state, c);
export const adultsOf = (state) => state.people.filter((x) => x.v?.rel !== REL_CHILD);
export const weekHours = (state, c, p) => dayPerson(state, c, p)?.h ?? WEEK_HOURS;
export const dayHours = (state, c, p) => Math.round(weekHours(state, c, p) / 5 * 100) / 100;
export const absentHours = (state, c, worked, p) => Math.max(0, Math.round((dayHours(state, c, p) - (worked || 0)) * 100) / 100);
// Hours as typed: "2", "2,5", "1:30" → number 0–24; '' → 0; false = not valid.
export function parseHours(input) {
  const t = String(input ?? '').trim().replace(',', '.');
  if (!t) return 0;
  const m = /^(\d{1,2}):([0-5]\d)$/.exec(t), v = m ? Number(m[1]) + Number(m[2]) / 60 : Number(t);
  return Number.isFinite(v) && v >= 0 && v <= 24 ? Math.round(v * 100) / 100 : false;
}
// c = a case or the Ny tråd draft (both keep values in c.f). Returns false when nothing changed.
export function addDay(c, fieldId, date, worked, today, kid, who) {
  const list = Array.isArray(c.f?.[fieldId]) ? c.f[fieldId] : [];
  if (!validDate(date) || list.length >= DAYS_MAX || list.some((x) => x[0] === date && (x[4] || '') === (who || '')) || worked === false) return false;
  c.f = { ...(c.f || {}), [fieldId]: cleanValue('days', [...list, [date, worked, 0, kid || 0, who || 0]]) }; c.u = today; return true;
}
export function setDay(c, fieldId, i, patch, today) {
  const x = c.f?.[fieldId]?.[i]; if (!x) return false;
  if ('w' in patch) { if (patch.w === false) return false; x[1] = patch.w; }
  if ('a' in patch) x[2] = patch.a ? 1 : 0;
  if ('k' in patch) x[3] = patch.k && okId(patch.k) ? patch.k : 0;
  if ('p' in patch) x[4] = patch.p && okId(patch.p) ? patch.p : 0;
  if ('k' in patch || 'p' in patch) { const r = cleanValue('days', [x])[0]; x.length = 0; x.push(...r); }
  c.u = today; return true;
}
export function delDay(c, fieldId, i, today) {
  const list = c.f?.[fieldId]; if (!list?.[i]) return false;
  list.splice(i, 1); if (!list.length) { delete c.f[fieldId]; if (!Object.keys(c.f).length) delete c.f; }
  c.u = today; return true;
}
// Eget val: the value is saved in the case and added to the field's list in the type (so it can be chosen next time).
export function addOption(state, c, fieldId, input, today) {
  const fd = typeOf(state, c)?.fields.find((f) => f.id === fieldId && f.kind === 'choice'), v = cleanText(input, 60);
  if (!fd || !v) return false;
  if (!fd.opts.includes(v) && fd.opts.length < OPTS_MAX) fd.opts.push(v);
  return setField(state, c, fieldId, v, today);
}
export function setField(state, c, fieldId, input, today) {
  const fd = typeOf(state, c)?.fields.find((f) => f.id === fieldId);
  if (!fd) return false;
  const v = parseInput(fd.kind, input);
  if (v === false) return false;
  const f = { ...(c.f || {}) };
  if (v === undefined) delete f[fd.id]; else f[fd.id] = v;
  if (Object.keys(f).length) c.f = f; else delete c.f;
  c.u = today;
  return true;
}
// Changing type. A value moves to a field with the same name and kind in the new type (else same id and kind).
// Values that fit nowhere are kept in c.o ("från tidigare typ": [name, kind, value, from-type]) and stay visible in
// the case; if a later type has a matching field they move back in. With drop = true the new leftovers are removed.
function typePlan(state, c, to) {
  const from = typeOf(state, c), f = {}, rest = [];
  const pool = [...Object.entries(c.f || {}).map(([k, v]) => { const fd = from?.fields.find((x) => x.id === k); return fd && { id: k, n: fd.name, k: fd.kind, v, from: from.name, cur: 1 }; }).filter(Boolean),
    ...(c.o || []).map(([n, k, v, fr]) => ({ n, k, v, from: fr }))];
  for (const x of pool) {
    const dst = to.fields.find((d) => d.name === x.n && d.kind === x.k && !(d.id in f)) || (x.id && to.fields.find((d) => d.id === x.id && d.kind === x.k && !(d.id in f)));
    if (dst) { if (x.v != null) f[dst.id] = x.v; } else rest.push(x);
  }
  return { f, rest };
}
// The values that would end up outside the fields if the case changed to typeId (for the question before the change).
export function typeChangeLoss(state, c, typeId) {
  const to = state.types.find((x) => x.id === typeId);
  return to ? typePlan(state, c, to).rest.filter((x) => x.cur) : [];
}
export function changeType(state, c, typeId, today, drop = false) {
  const to = state.types.find((x) => x.id === typeId);
  if (!to || to.id === c.t) return false;
  const { f, rest } = typePlan(state, c, to);
  const o = rest.filter((x) => !(drop && x.cur)).slice(0, LIM.fields).map((x) => [x.n, x.k, x.v, x.from]);
  c.t = to.id;
  if (Object.keys(f).length) c.f = f; else delete c.f;
  if (o.length) c.o = o; else delete c.o;
  c.u = today;
  return true;
}
// Repeat (c.r: 'm' month | 'y' year): when the case is closed a new open copy is made with every date moved forward.
export const REPEAT = { w: 'Varje vecka', m: 'Varje månad', y: 'Varje år' };
// One repeat step on: a week, a month or a year.
export const stepOn = (k, rep) => (rep === 'w' ? addDays(k, 7) : addMonths(k, rep === 'y' ? 12 : 1));
export function addMonths(k, n) {
  const [y, m, d] = k.split('-').map(Number), t = new Date(y, m - 1 + n, 1, 12);
  const last = new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate();   // 31 jan + 1 month = 28/29 feb
  t.setDate(Math.min(d, last)); return dateKey(t);
}
export function nextCase(state, c, today) {
  if (!REPEAT[c.r] || !roomFor(state)) return null;
  const mv = (v) => { const d = stepOn(v.slice(0, 10), c.r); return validDate(d) ? d + v.slice(10) : v; };
  const t = typeOf(state, c), dated = new Set((t?.fields || []).filter((f) => f.kind === 'date' || f.kind === 'dt').map((f) => f.id));
  const nc = { id: uid(), t: c.t, title: c.title, c: today, u: today, r: c.r };
  if (c.p) nc.p = c.p;   // the repeat keeps who does it
  if (c.f) nc.f = Object.fromEntries(Object.entries(c.f).filter(([k]) => t?.fields.some((f) => f.id === k && f.kind !== 'check' && f.kind !== 'days')).map(([k, v]) => [k, dated.has(k) ? mv(v) : v]));
  if (nc.f && !Object.keys(nc.f).length) delete nc.f;
  if (c.o) nc.o = c.o.map(([nm, k, v, fr]) => [nm, k, v == null || k === 'check' ? null : (k === 'date' || k === 'dt') ? mv(v) : v, fr]);
  if (c.s) nc.s = c.s.map(([x, , d, , r]) => cleanStep(x, 0, d ? mv(d) : 0, 0, r));
  state.cases.unshift(nc);
  return nc;
}
// The earliest date in a case (fields, extra fields, sub-goals) – shown when a repeat is made.
export function firstDate(state, c) {
  const t = typeOf(state, c), ds = [];
  for (const f of t?.fields || []) if ((f.kind === 'date' || f.kind === 'dt') && c.f?.[f.id]) ds.push(c.f[f.id].slice(0, 10));
  for (const [, k, v] of c.o || []) if ((k === 'date' || k === 'dt') && v) ds.push(v.slice(0, 10));
  for (const [, , d] of c.s || []) if (d) ds.push(d);
  return ds.sort()[0] || '';
}
// Viktigaste datumet (2026-11-18) för sorteringen Datum: närmaste deadline (fält med due) eller delmål som inte är klart;
// annars närmaste kommande datum i tråden (t.ex. Intervju, Visning); annars det senaste (t.ex. Sökt).
export function keyDate(state, c, today = dateKey(new Date())) {
  const t = typeOf(state, c), dayDate = (rows) => { const open = rows.filter((r) => !r[2]).map((r) => r[0]).sort(); return open[0] || rows.map((r) => r[0]).sort().pop() || ''; };
  // Typens slutdatum först (t.ex. Ny bostad: Ansök senast, annars Visning).
  for (const id of t?.end || []) {
    const f = t.fields.find((x) => x.id === id), v = c.f?.[id];
    if (f && v && shownField(f, c)) return f.kind === 'days' ? dayDate(v) : v.slice(0, 10);
  }
  // Inget slutdatum ifyllt: närmaste deadline eller öppet delmål, annars nästa datum, annars det senaste.
  const due = [], other = [];
  for (const f of t?.fields || []) if ((f.kind === 'date' || f.kind === 'dt') && c.f?.[f.id] && shownField(f, c)) (f.due ? due : other).push(c.f[f.id].slice(0, 10));
  for (const [, k, v] of c.o || []) if ((k === 'date' || k === 'dt') && v) other.push(v.slice(0, 10));
  for (const [, d, dd] of c.s || []) if (!d && dd) due.push(dd);
  for (const f of t?.fields || []) if (f.kind === 'days' && c.f?.[f.id]?.length) other.push(dayDate(c.f[f.id]));
  if (due.length) return due.sort()[0];
  const next = other.filter((d) => d >= today).sort()[0];
  return next || other.sort().pop() || '';
}
// Papperskorg: Ta bort moves a case here; it is deleted for good after trashDays (0 = never).
export const TRASH_DAYS = [7, 30, 90, 365, 0];
export function trashCase(state, c, today) {
  const i = state.cases.indexOf(c); if (i < 0) return false;
  state.cases.splice(i, 1); state.trash.push({ ...c, d: today });
  if (state.trash.length > LIM.trash) state.trash.shift();
  return true;
}
export function restoreCase(state, id) {
  const i = state.trash.findIndex((c) => c.id === id); if (i < 0 || state.cases.length >= LIM.cases || (!state.trash[i].x && !roomFor(state))) return null;
  const [c] = state.trash.splice(i, 1); delete c.d; state.cases.unshift(c); return c;
}
export const purgeDate = (state, c) => (state.trashDays ? addDays(c.d, state.trashDays) : '');
// Removes cases whose time in the trash has run out. Returns how many.
export function purgeTrash(state, today) {
  const n = state.trash.length;
  if (state.trashDays) state.trash = state.trash.filter((c) => purgeDate(state, c) > today);
  return n - state.trash.length;
}
// A sub-goal: [text, done 0|1, deadline date or 0, done date or 0, repeat 'w'|'m'|'y'] – trailing empty parts left out.
export function cleanStep(text, done, due, doneOn, rep) {
  const r = [cleanText(text, 80), done ? 1 : 0, validDate(due) ? due : 0, done && validDate(doneOn) ? doneOn : 0, REPEAT[rep] ? rep : 0];
  while (r.length > 2 && !r[r.length - 1]) r.pop();
  return r;
}
// Ticks a sub-goal on or off; ticked gets today as its done date (can be changed afterwards). A repeating sub-goal
// adds its next turn (same text, deadline a month or year on – from the deadline, else from today) right after it;
// unticking takes that turn away again if it is still untouched.
export function setStepDone(c, i, done, today) {
  const x = c.s?.[i]; if (!x) return false;
  const rep = x[4], nx = c.s[i + 1];
  if (done && !x[1] && REPEAT[rep] && c.s.length < LIM.steps) {
    c.s.splice(i + 1, 0, cleanStep(x[0], 0, stepOn(x[2] || today, rep), 0, rep));
    c.s[i] = cleanStep(x[0], 1, x[2], today);   // the done one keeps its history, the repeat moves on
  } else if (!done && x[1] && nx && !nx[1] && nx[0] === x[0] && REPEAT[nx[4]]) {
    c.s.splice(i + 1, 1); c.s[i] = cleanStep(x[0], 0, x[2], 0, nx[4]);
  } else c.s[i] = cleanStep(x[0], done, x[2], done ? today : 0, rep);
  c.u = today; return true;
}
export function setStepRepeat(c, i, rep, today) {
  const x = c.s?.[i]; if (!x || x[1]) return false;
  c.s[i] = cleanStep(x[0], 0, x[2], 0, rep); c.u = today; return true;
}
// Items typed as one line: "mjölk, bröd; ägg" → three. Only for shopping lists (a list type: Inköp).
export const splitItems = (v) => String(v ?? '').split(/[,;\n]/).map((x) => cleanText(x, 80)).filter(Boolean);
export const isList = (c) => c?.t === 'shop';
// Sub-goals in display order with their index: in a shopping list the ticked ones go last.
export const stepOrder = (c) => (c.s || []).map((x, i) => [x, i]).sort((a, b) => (isList(c) ? a[0][1] - b[0][1] : 0) || a[1] - b[1]);
export const progress = (c) => [(c.s || []).filter((x) => x[1]).length, (c.s || []).length];
export const openCases = (state) => state.cases.filter((c) => !c.x).sort((a, b) => (a.u < b.u ? 1 : a.u > b.u ? -1 : 0));
export const closedCases = (state) => state.cases.filter((c) => c.x).sort((a, b) => (a.x < b.x ? 1 : a.x > b.x ? -1 : 0));
// Sortering (Trådar och Arkiv): sort = { cases?: "u-", arch?: "x+" } – kolumn + riktning (+ stigande, - fallande).
// A new column starts in its natural direction (SORT_ASC: A–Ö and nearest date first); the same column again flips it.
export const SORTS = { cases: { u: 'Ändrad', c: 'Skapad', d: 'Datum', t: 'Rubrik' }, arch: { x: 'Stängd', c: 'Skapad', t: 'Rubrik' } };
export const SORT_ASC = ['d', 't'];
const SORT_DEFAULT = { cases: 'u-', arch: 'x-' };
const validSort = (list, v) => typeof v === 'string' && v.length === 2 && Object.hasOwn(SORTS[list], v[0]) && '+-'.includes(v[1]);
export const sortOf = (state, list) => (validSort(list, state.sort?.[list]) ? state.sort[list] : SORT_DEFAULT[list]);
// Next sort after a tap on column k.
export function nextSort(state, list, k) {
  const cur = sortOf(state, list);
  return k + (cur[0] === k ? (cur[1] === '+' ? '-' : '+') : SORT_ASC.includes(k) ? '+' : '-');
}
// A sorted copy. Cases without the value (no date) come last in both directions; ties keep the order given.
export function sortCases(state, list, spec) {
  const k = spec[0], dir = spec[1] === '+' ? 1 : -1;
  const val = (c) => (k === 'd' ? keyDate(state, c) : k === 't' ? c.title : c[k] || '');
  const rows = list.map((c) => [c, val(c)]);
  rows.sort(([, a], [, b]) => (!a ? (b ? 1 : 0) : !b ? -1 : dir * (k === 't' ? a.localeCompare(b, 'sv') : a < b ? -1 : a > b ? 1 : 0)));
  return rows.map(([c]) => c);
}
// Aktuellt: dates in open cases within alertDays (incl. today), plus passed deadlines (fields with due). Sorted by date.
export const ALERT_DAYS = [1, 3, 7, 14, 30];
export function alerts(state, today, days = state.alertDays ?? 7) {
  const end = addDays(today, days), out = [];
  for (const c of state.cases) {
    if (c.x) continue;
    const t = typeOf(state, c);
    const items = [...(t?.fields || []).map((fd) => [fd.name, fd.kind, c.f?.[fd.id], fd.due]), ...(c.o || []).map(([n, k, v]) => [n, k, v, 0])];
    for (const [name, kind, v, due] of items) {
      if ((kind !== 'date' && kind !== 'dt') || v == null) continue;
      const d = v.slice(0, 10);
      if (d <= end && (d >= today || due)) out.push({ c, name, v, kind, days: daysBetween(today, d), late: d < today });
    }
    for (const [x, done, d] of c.s || []) {   // a sub-goal with a date is a deadline until it is ticked off
      if (!done && d && d <= end) out.push({ c, name: 'Delmål ' + x, v: d, kind: 'date', days: daysBetween(today, d), late: d < today });
    }
  }
  return out.sort((a, b) => (a.v < b.v ? -1 : a.v > b.v ? 1 : 0));
}
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
  version: 'tal, 6 (äldre: typen Försäkringskassan läggs till vid import)',
  people: `lista { id, name ≤ 30, h?: arbetstimmar per vecka 1–80 (standard ${WEEK_HOURS}), v?: { egenskaps-id: värde efter egenskapens kind } }, ≤ ${LIM.people}: personer som kan utföra ett ärende`,
  pfields: `personers egenskaper, samma form som types[].fields men kind: ${PERSON_KINDS.join(' | ')}, ≤ ${LIM.pfields} (saknas = standard: Relation, Född, Telefon, E-post, Arbetsgivare eller skola, Anteckning)`,
  alertDays: `påminn så många dagar innan: ${ALERT_DAYS.join(' | ')} (standard 7)`,
  sort: `sortering, valfri: { cases?: Trådar, arch?: Arkiv } – kolumn + riktning (+ stigande, - fallande). cases: ${Object.keys(SORTS.cases).join(' | ')}, arch: ${Object.keys(SORTS.arch).join(' | ')} (u ändrad, c skapad, x stängd, d första datum, t rubrik). Standard u- och x-`,
  cats: `lista { id, name ≤ 30, color: ${COLORS.join(' | ')} }, 1–${LIM.cats}`,
  types: `lista { id, name ≤ 30, icon ≤ 8 tecken, cat: kategori-id, on: 0 | 1, fields: [{ id, name ≤ 40, kind: ${Object.keys(KINDS).join(' | ')}, due?: 1 = deadline, visas även när den passerats (bara date/dt), opts?: [val ≤ 60] ≤ ${OPTS_MAX} (bara choice), if?: [fält-id, värde] = visas bara när det fältet har värdet }] (≤ ${LIM.fields}), steps?: [text ≤ 80] (≤ ${LIM.typeSteps}), r?: nya ärenden upprepas w | m | y, end?: [fält-id] slutdatum i prioritetsordning (date/dt/days), används för sorteringen Datum }, 1–${LIM.types}`,
  cases: `lista { id, t: typ-id, title ≤ 80, c: skapad datum, u: ändrad datum, x?: stängd datum, p?: person-id (vem som utför), r?: upprepa när det stängs w = varje vecka | m = varje månad | y = varje år (nytt öppet ärende med datumen flyttade), f?: { fält-id: värde efter fältets kind (text ≤ 200, choice ≤ 60 (ett av opts eller eget), note ≤ 2000, date, dt, num ±1e9, check 1, days [[datum, arbetade timmar 0–24, ansökt 0 | 1, barn? person-id eller 0, vem? person-id (vem som var hemma, annars trådens person)]] (en rad per datum och person) ≤ ${DAYS_MAX}) }, s?: [[delmål ≤ 80, 0 | 1, deadline-datum eller 0?, klart-datum eller 0? (bara när avbockat), upprepa? w | m | y]] (≤ ${LIM.steps}), l?: [[datum, anteckning ≤ 500]] (≤ ${LIM.log} nya, äldre data upp till ${LIM.logKeep} behålls), o?: extra fält bara i ärendet [[fältnamn ≤ 40, kind, värde | null, från typnamn ≤ 30 eller ""]] (≤ ${LIM.fields}) }, max ${LIM.cases} (varav högst ${LIM.open} öppna)`,
  trash: `papperskorg: borttagna trådar, samma form som cases plus d: borttagen datum, max ${LIM.trash}`,
  trashDays: `dagar i papperskorgen innan tråden raderas: ${TRASH_DAYS.join(' | ')} (0 = aldrig, standard 30)`,
  backup: '{ remind: "week" | "month" | "off", last?: datum, asked?: datum }',
};
export const EXPORT_EXAMPLE = {
  version: 12,
  pfields: [{ id: 'rel', name: 'Relation', kind: 'choice', opts: ['Jag', 'Barn'] }],
  people: [{ id: 'p1', name: 'Anna', h: 30, v: { rel: 'Jag' } }],
  cats: [{ id: 'h', name: 'Hälsa', color: 'pink' }],
  types: [{ id: 'sym', name: 'Symptom', icon: '🩺', cat: 'h', on: 1, fields: [{ id: 's1', name: 'Symptom', kind: 'text' }, { id: 's3', name: 'Kontaktat vården', kind: 'check' }] }],
  cases: [{ id: 'c1', t: 'sym', title: 'Ont i knät', p: 'p1', c: '2026-11-10', u: '2026-11-12', f: { s1: 'Värk vid trappor', s3: 1 }, s: [['Ring vårdcentralen', 1], ['Gå på besöket', 0]], l: [['2026-11-12', 'Fick tid 18/11']] }],
  backup: { remind: 'month' },
};
export function exportText(state, today) {
  const J = JSON.stringify;
  return `{\n "app": ${J(EXPORT_APP)},\n "format": ${EXPORT_FORMAT},\n "exported": ${J(today)},\n "appVersion": ${J(globalThis.APP_VERSION ?? null)},\n` +
    ` "readme": ${J(EXPORT_README)},\n "schema": ${J(EXPORT_SCHEMA, null, 1).replace(/\n/g, '\n ')},\n "example": ${J(EXPORT_EXAMPLE)},\n "data": ${J(state)}\n}\n`;
}
