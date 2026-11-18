// Vy: Trådar (öppna trådar, filter per kategori), typväljaren och tråden (lager – Bakåt stänger). Tråden används också från Arkiv.
import { openCases, sortCases, sortOf, SORTS, typeOf, catOf, personOf, childrenOf, adultsOf, dayPerson, dayHours, weekHours, absentHours, parseKey, progress, daysBetween, KINDS, REPEAT, stepOrder, isList, shownField } from '../store.js';
import { today, S, el, shortDate, longDate, setOpen } from '../ui.js';
import { typeEditor } from './settings.js';

const ago = (k) => { const d = daysBetween(k, today()); return d <= 0 ? 'idag' : d === 1 ? 'igår' : `${d} dagar`; };
// A case row: coloured edge = category (CSS class from a fixed list, never a colour from data).
export function caseRow(c) {
  const t = typeOf(S.state, c), cat = catOf(S.state, t), [done, all] = progress(c), open = S.exp === c.id, who = personOf(S.state, c), dd = daysCount(c, t);
  const sel = !!S.sel, on = sel && S.sel.includes(c.id);   // markeringsläge: a tap marks, the icon becomes a check box
  return el('li', { class: `case-li c-${cat.color}` + (open && !sel ? ' open' : '') + (on ? ' marked' : '') }, el('div', { class: 'case-line' }, el('button', { class: `case-row c-${cat.color}`, 'data-act': sel ? 'selt' : 'copen', 'data-id': c.id, ...(sel ? { 'aria-pressed': String(on) } : {}) },
    sel ? el('span', { class: 'sel-box', 'aria-hidden': 'true', text: on ? '✓' : '' }) : el('span', { class: 'case-icon', 'aria-hidden': 'true', text: t?.icon || '📌' }),
    el('span', { class: 'case-main' }, el('span', { class: 'case-title', text: c.title }),
      el('small', { text: `${t?.name ?? 'Okänd typ'} · ${c.x ? 'stängd ' + shortDate(c.x) : 'ändrad ' + ago(c.u)}` + (who ? ` · 👤 ${who.name}` : '') + (dd ? ` · ${dd[1]}/${dd[0]} ansökta` : '') })),
    all ? el('span', { class: 'case-prog', 'aria-label': `${done} av ${all} delmål klara`, text: `${done}/${all}` }) : null,
    ),
    sel ? null : el('button', { class: 'case-chev', 'data-act': 'cexp', 'data-id': c.id, 'aria-expanded': String(open), 'aria-label': open ? `Dölj sammanfattning av ${c.title}` : `Visa sammanfattning av ${c.title}`, text: open ? '▴' : '▾' })),
    open && !sel ? caseSummary(c, t, cat) : null);
}
// Logg (2026-11-18): korta anteckningar visas hela; långa (flera rader eller > 90 tecken) fälls ihop till första raden.
const firstLine = (x) => { const l = x.split('\n').find((y) => y.trim()) || ''; return l.length > 80 ? l.slice(0, 78) + '…' : l; };
function logText(x) {
  const t = x.replace(/\n{3,}/g, '\n\n');
  if (!t.includes('\n') && t.length <= 90) return el('span', { class: 'log-x', text: t });
  return el('details', { class: 'log-x log-fold' }, el('summary', { text: firstLine(t) }), el('div', { class: 'log-full', text: t }));
}
// Read-only summary under a row: filled fields, sub-goals and the latest notes, then Öppna tråden.
export const showVal = (fd, v) => fd.kind === 'days' ? `${v.length} ${v.length === 1 ? 'dag' : 'dagar'} · ${v.filter((x) => x[2]).length} ansökta` : fd.kind === 'check' ? 'Ja' : fd.kind === 'date' ? longDate(v) : fd.kind === 'dt' ? `${longDate(v.slice(0, 10))} ${v.slice(11)}` : fd.kind === 'num' ? Number(v).toLocaleString('sv-SE') : String(v);
export function caseSummary(c, t, cat, actions) {
  const fields = (t?.fields || []).filter((fd) => c.f?.[fd.id] !== undefined && shownField(fd, c));
  const log = (c.l || []).slice(-3).reverse();
  return el('div', { class: `case-sum c-${cat.color}` },
    fields.length ? el('dl', {}, fields.map((fd) => [el('dt', { text: fd.name }), el('dd', { text: showVal(fd, c.f[fd.id]) })])) : c.o?.some((x) => x[2] != null) ? null : el('p', { class: 'muted small', text: 'Inga fält ifyllda än.' }),
    c.o?.some((x) => x[2] != null) ? el('dl', { class: 'sum-old' }, c.o.filter((x) => x[2] != null).map(([n, k, v]) => [el('dt', { text: n }), el('dd', { text: showVal({ kind: k }, v) })])) : null,
    c.s?.length ? el('ul', { class: 'sum-steps' }, c.s.map(([x, d, dd, dn]) => el('li', { class: d ? 'done' : '', text: (d ? '✓ ' : '○ ') + x + (d ? (dn ? ` · klart ${shortDate(dn)}` : '') : dd ? ` · ${shortDate(dd)}` : '') }))) : null,
    log.length ? el('ul', { class: 'sum-log' }, log.map(([d, x]) => el('li', {}, el('small', { text: shortDate(d) + ' ' }), el('span', { text: firstLine(x) })))) : null,
    actions || el('button', { class: 'sum-open', 'data-act': 'copen', 'data-id': c.id, text: 'Öppna tråden →' }));
}
// Category chips over a list of cases (Trådar, Arkiv, Papperskorg). key = the S property holding the filter, act = its data-act.
// Returns [chips, filtered list]; a filter whose category is now empty falls back to Alla.
export function catFilter(all, key, act) {
  const counts = new Map();
  for (const c of all) { const k = typeOf(S.state, c)?.cat; counts.set(k, (counts.get(k) || 0) + 1); }
  if (S[key] !== 'all' && !counts.get(S[key])) S[key] = 'all';
  const chip = (id, label, color) => el('button', { class: 'chip' + (color ? ` c-${color}` : '') + (S[key] === id ? ' on' : ''), 'data-act': act, 'data-id': id, 'aria-pressed': String(S[key] === id), text: label });
  const chips = el('div', { class: 'chips cat-chips', role: 'group', 'aria-label': 'Kategori' }, chip('all', `Alla ${all.length}`),
    S.state.cats.filter((k) => counts.get(k.id)).map((k) => chip(k.id, `${k.name} ${counts.get(k.id)}`, k.color)));
  return [chips, S[key] === 'all' ? all : all.filter((c) => typeOf(S.state, c)?.cat === S[key])];
}
// Sortera: a chip in the filter row (↕ Ändrad ↓) unfolds the columns; a tap picks a column, the same one again flips
// the direction. which = 'cases' | 'arch'. Returns [chip, column row or null].
export function sortBar(which) {
  const cur = sortOf(S.state, which), cols = SORTS[which], arrow = cur[1] === '+' ? '↑' : '↓', dir = cur[1] === '+' ? 'stigande' : 'fallande';
  const chip = el('button', { class: 'chip sort-chip' + (S.sortOpen ? ' on' : ''), 'data-act': 'sortopen', 'aria-expanded': String(!!S.sortOpen), 'aria-label': `Sortering: ${cols[cur[0]]}, ${dir}. Tryck för att välja`, text: `↕ ${cols[cur[0]]} ${arrow}` });
  const row = S.sortOpen ? el('div', { class: 'chips sort-cols', role: 'group', 'aria-label': 'Sortera på' },
    Object.entries(cols).map(([k, l]) => el('button', { class: 'chip' + (k === cur[0] ? ' on' : ''), 'data-act': 'sortcol', 'data-id': `${which}:${k}`, 'aria-pressed': String(k === cur[0]),
      'aria-label': k === cur[0] ? `${l}, ${dir} – tryck för att vända` : `Sortera på ${l}`, text: k === cur[0] ? `${l} ${arrow}` : l }))) : null;
  return [chip, row];
}
// One row: person select, category chips (scroll sideways when they don't fit), sort chip at the end.
export function filterRow(pchips, chips, schip) {
  return el('div', { class: 'filter-row' }, pchips, chips, schip);
}
// Person filter: one compact chip-styled select (👤 Alla ▾) placed first in the category row. Only shown when some case in
// the list has a person. key = the S property, act = its data-act (a change event). Returns [select or null, filtered list].
export function personFilter(all, key, act) {
  const counts = new Map();
  for (const c of all) { const k = personOf(S.state, c)?.id || '-'; counts.set(k, (counts.get(k) || 0) + 1); }
  if (S[key] !== 'all' && !counts.get(S[key])) S[key] = 'all';
  if (counts.size < 2 && !(S.state.people || []).some((x) => counts.get(x.id))) return [null, all];   // nobody assigned: nothing to filter
  const opt = (id, label) => el('option', { value: id, selected: S[key] === id, text: label });
  const sel = el('select', { class: 'chip person-sel' + (S[key] !== 'all' ? ' on' : ''), 'data-act': act, 'aria-label': 'Vem utför' }, opt('all', '👤 Alla'),
    S.state.people.filter((x) => counts.get(x.id)).map((x) => opt(x.id, `👤 ${x.name} ${counts.get(x.id)}`)),
    counts.get('-') ? opt('-', `👤 Ingen ${counts.get('-')}`) : null);
  return [sel, S[key] === 'all' ? all : all.filter((c) => (personOf(S.state, c)?.id || '-') === S[key])];
}
// "Vem" select (Ny tråd, Redigera); nothing when no people are added.
export function personSelect(cur, act) {
  const people = S.state.people || [];
  if (!people.length) return null;
  return el('label', { class: 'goal-row' }, el('span', { text: 'Vem utför' }),
    el('select', { 'data-act': act, 'aria-label': 'Vem utför' }, el('option', { value: '', selected: !cur, text: 'Ingen vald' }),
      people.map((x) => el('option', { value: x.id, selected: x.id === cur, text: x.name }))));
}

// Ny tråd in one step: rubrik, typ, and the chosen type's own fields right below (draft S.draft, saved on Skapa).
function picker() {
  const types = S.state.types.filter((t) => t.on), d = S.draft, dt = d && types.find((t) => t.id === d.t);
  return el('section', { class: 'card' },
    el('div', { class: 'add-top' },
      el('button', { class: 'icon', 'data-act': 'pickclose', 'aria-label': 'Stäng', text: '✕' }),
      el('h1', { class: 'add-title', text: 'Ny tråd' })),
    el('input', { type: 'text', id: 'new-title', class: 'search', maxlength: 80, value: S.newTitle, placeholder: 'Rubrik, t.ex. Ont i knät', 'aria-label': 'Rubrik', autocomplete: 'off' }),
    el('p', { class: 'import-error small', id: 'new-error', role: 'alert' }),
    el('p', { class: 'muted small', text: 'Välj typ – fälten visas under. Fyll i det du vet, resten kan vänta.' }),
    el('ul', { class: 'type-grid' }, types.map((t) => el('li', {}, el('button', { class: `type-btn c-${catOf(S.state, t).color}` + (dt === t ? ' on' : ''), 'data-act': 'ptype', 'data-id': t.id, 'aria-pressed': String(dt === t) },
      el('span', { class: 'case-icon', 'aria-hidden': 'true', text: t.icon }), el('span', { text: t.name }))))),
    dt ? el('div', { class: `draft c-${catOf(S.state, dt).color}` },
      el('h2', { class: 'sub-h', text: `${dt.icon} ${dt.name}` }),
      personSelect(d.p, 'dperson'),
      dt.fields.filter((fd) => shownField(fd, d)).map((fd) => fieldInput(d, fd, 'dv')),
      el('p', { class: 'import-error small', id: 'd-error', role: 'alert' }),
      dt.steps?.length ? [el('h2', { class: 'sub-h', text: 'Delmål' }),
        el('p', { class: 'muted small', text: 'Förslag från typen. Bocka ur det du inte behöver – ändra förslagen under Inställningar → Typer.' }),
        el('ul', { class: 'steps' }, dt.steps.map((x, i) => el('li', {}, el('label', {},
          el('input', { type: 'checkbox', checked: !(d.skip || []).includes(i), 'data-act': 'dstep', 'data-i': i }), el('span', { text: x })))))] : null,
      el('button', { class: 'primary', 'data-act': 'cnew', 'data-id': dt.id, text: 'Skapa tråd' })) : null,
    el('p', { class: 'muted small', text: 'Fler typer, och egna, under Inställningar → Typer.' }));
}

// Dagar (VAB, föräldrapenning): [count, applied] over the type's days fields, or null.
function daysCount(c, t) {
  const rows = (t?.fields || []).filter((fd) => fd.kind === 'days').flatMap((fd) => c.f?.[fd.id] || []);
  return rows.length ? [rows.length, rows.filter((x) => x[2]).length] : null;
}
const hrs = (n) => n.toLocaleString('sv-SE', { maximumFractionDigits: 2 });
const dayName = (k) => parseKey(k).toLocaleDateString('sv-SE', { weekday: 'short', day: 'numeric', month: 'short' });
// A days field: each day with Ansökt to tick off one by one, hours away = normal day (the person's) − hours worked.
// mode 'view' (tick + add), 'edit' and 'draft' (also hours worked and remove). c = the case or the Ny tråd draft.
export function daysBlock(c, fd, mode) {
  const list = c.f?.[fd.id] || [], who = personOf(S.state, c), dh = dayHours(S.state, c), full = mode !== 'view', kids = childrenOf(S.state);
  const kidName = (k) => S.state.people.find((x) => x.id === k)?.name;
  const lastKid = list.at(-1)?.[3] || (kids.length === 1 ? kids[0].id : ''), adults = adultsOf(S.state), many = adults.length > 1;
  const pName = (p) => dayPerson(S.state, c, p)?.name;
  const whoSel = (attrs, cur) => el('select', { class: 'day-kid', ...attrs }, el('option', { value: '', selected: !cur, text: who ? who.name : 'Vem…' }), adults.filter((x) => x.id !== c.p).map((x) => el('option', { value: x.id, selected: x.id === cur, text: x.name })));
  const kidSel = (attrs, cur) => el('select', { class: 'day-kid', ...attrs }, el('option', { value: '', selected: !cur, text: 'Barn…' }), kids.map((x) => el('option', { value: x.id, selected: x.id === cur, text: x.name })));
  return el('div', { class: 'days' },
    el('h2', { class: 'sub-h', text: fd.name + (list.length ? ` · ${list.filter((x) => x[2]).length} av ${list.length} ansökta` : '') }),
    // The working day everything is counted from: one cell per hour, and where the number comes from.
    el('div', { class: 'day-norm' },
      el('div', { class: 'day-norm-top' }, el('span', { text: '🕗 En arbetsdag' }), el('strong', { text: `${hrs(dh)} tim` })),
      el('div', { class: 'day-cells', 'aria-hidden': 'true' }, Array.from({ length: Math.min(12, Math.ceil(dh)) }, () => el('span'))),
      el('small', { text: `${who ? who.name : 'Ingen person vald'}: ${hrs(weekHours(S.state, c))} tim/vecka ÷ 5 dagar. Timmar borta = ${hrs(dh)} − det du jobbade.` })),
    list.length ? el('ul', { class: 'day-list' }, list.map(([d, w, a], i) => el('li', { class: a ? 'done' : '' },
      el('label', { class: 'day-main' }, el('input', { type: 'checkbox', checked: !!a, 'data-act': 'dayapp', 'data-id': fd.id, 'data-i': i, 'aria-label': `Ansökt för ${dayName(d)}` }),
        el('span', { class: 'day-txt' }, el('span', { text: dayName(d) }),
          el('small', { text: (many && pName(list[i][4]) ? `👤 ${pName(list[i][4])} · ` : '') + (kidName(list[i][3]) ? `👶 ${kidName(list[i][3])} · ` : '') + `${hrs(absentHours(S.state, c, w, list[i][4]))} av ${hrs(dayHours(S.state, c, list[i][4]))} tim borta` + (w ? ` · jobbat ${hrs(w)}` : '') + (a ? ' · ansökt' : '') }),
          el('progress', { class: 'day-bar', max: dayHours(S.state, c, list[i][4]) || 1, value: absentHours(S.state, c, w, list[i][4]), 'aria-hidden': 'true' }))),
      full ? el('div', { class: 'day-ctl' },
        many ? whoSel({ 'data-act': 'dayp', 'data-id': fd.id, 'data-i': i, 'aria-label': `Vem ${dayName(d)}` }, list[i][4]) : null,
        kids.length ? kidSel({ 'data-act': 'dayk', 'data-id': fd.id, 'data-i': i, 'aria-label': `Barn ${dayName(d)}` }, list[i][3]) : null,
        el('input', { type: 'text', inputmode: 'decimal', class: 'day-w', value: w ? hrs(w) : '', placeholder: '0', 'data-act': 'dayw', 'data-id': fd.id, 'data-i': i, 'aria-label': `Arbetade timmar ${dayName(d)}`, autocomplete: 'off' }),
        el('button', { class: 'icon sm', 'data-act': 'daydel', 'data-id': fd.id, 'data-i': i, 'aria-label': `Ta bort ${dayName(d)}`, text: '✕' })) : null))) : null,
    el('div', { class: 'pick-row day-add' },
      el('label', { class: 'day-lab' }, el('span', { text: 'Dag' }), el('input', { type: 'date', id: 'dy-d-' + fd.id, class: 'step-date', value: today() })),
      many ? el('label', { class: 'day-lab' }, el('span', { text: 'Vem' }), whoSel({ id: 'dy-p-' + fd.id })) : null,
      kids.length ? el('label', { class: 'day-lab' }, el('span', { text: 'Barn' }), kidSel({ id: 'dy-k-' + fd.id }, lastKid)) : null,
      el('label', { class: 'day-lab' }, el('span', { text: many ? 'Jobbade, tim' : `Jobbade, av ${hrs(dh)} tim` }), el('input', { type: 'text', inputmode: 'decimal', id: 'dy-w-' + fd.id, class: 'day-w', placeholder: '0', autocomplete: 'off' })),
      el('button', { class: 'weigh-save add-btn', 'data-act': 'dayadd', 'data-id': fd.id, text: '+ Lägg till dag' })),
    many ? null : el('p', { class: 'muted small', text: 'Vill du välja vem som var hemma per dag (t.ex. du eller din partner): lägg till personen under Inställningar → Personer.' }),
    kids.length ? null : el('p', { class: 'muted small', text: 'Vill du välja barn per dag: lägg till barnet under Inställningar → Personer med Relation Barn.' }),
    el('p', { class: 'import-error small', id: 'dy-e-' + fd.id, role: 'alert' }));
}

function fieldInput(c, fd, act = 'fv') {
  if (fd.kind === 'days') return daysBlock(c, fd, act === 'dv' ? 'draft' : 'edit');
  const v = c.f?.[fd.id], id = 'f-' + fd.id, common = { id, 'data-act': act, 'data-id': fd.id, autocomplete: 'off' };
  const label = (...kids) => el('label', { class: 'cfield' + (fd.kind === 'check' ? ' cfield-check' : '') }, kids);
  switch (fd.kind) {
    case 'check': return label(el('input', { ...common, type: 'checkbox', checked: v === 1 }), el('span', { text: fd.name }));
    case 'note': return label(el('span', { text: fd.name }), el('textarea', { ...common, rows: 2, maxlength: 2000, text: v ?? '' }));
    case 'choice': {   // a list from the type, plus Eget val… (typed here, then added to the list)
      if (S.own === fd.id) return label(el('span', { text: fd.name }), el('div', { class: 'pick-row own-row' },
        el('input', { id, type: 'text', maxlength: 60, value: '', placeholder: 'Eget val, t.ex. Bostadstillägg', 'data-act': act + 'own', 'data-id': fd.id, autocomplete: 'off' }),
        el('button', { class: 'link', 'data-act': 'owncancel', text: 'Avbryt' })));
      const opts = [...(fd.opts || [])]; if (v && !opts.includes(v)) opts.unshift(v);
      return label(el('span', { text: fd.name }), el('select', { ...common },
        el('option', { value: '', selected: !v, text: 'Välj…' }), opts.map((o) => el('option', { value: o, selected: o === v, text: o })),
        el('option', { value: '\u0000own', text: '+ Eget val…' })));
    }
    case 'date': return label(el('span', { text: fd.name }), el('input', { ...common, type: 'date', value: v ?? '' }));
    case 'dt': return label(el('span', { text: fd.name }), el('input', { ...common, type: 'datetime-local', value: v ?? '' }));
    case 'num': return label(el('span', { text: fd.name }), el('input', { ...common, type: 'text', inputmode: 'decimal', value: v != null ? String(v).replace('.', ',') : '' }));
    default: return label(el('span', { text: fd.name }), el('input', { ...common, type: 'text', maxlength: 200, value: v ?? '' }));
  }
}

// View mode (tapping a case): read-only, plus the quick actions tick a sub-goal and add a note. Redigera opens caseEditor().
export function caseView() {
  const c = S.state.cases.find((x) => x.id === S.open);
  if (!c) return null;
  if (S.edit) return caseEditor();
  const t = typeOf(S.state, c), cat = catOf(S.state, t), [done, all] = progress(c);
  const fields = (t?.fields || []).filter((fd) => fd.kind !== 'days' && c.f?.[fd.id] !== undefined && shownField(fd, c)), extra = (c.o || []).filter((x) => x[2] != null), who = personOf(S.state, c);
  return el('section', { class: `card case c-${cat.color}` },
    el('div', { class: 'add-top' },
      el('button', { class: 'icon', 'data-act': 'cclose', 'aria-label': 'Stäng', text: '✕' }),
      el('span', { class: 'cat-chip', text: `${t?.icon || '📌'} ${t?.name ?? 'Okänd typ'} · ${cat.name}` })),
    el('h1', { class: 'case-h case-h-view', text: c.title }),
    el('p', { class: 'muted small', text: `Skapad ${longDate(c.c)} · ändrad ${longDate(c.u)}` + (c.x ? ` · stängd ${longDate(c.x)}` : '') + (c.r ? ` · upprepas ${REPEAT[c.r].toLowerCase()}` : '') }),
    who ? el('p', { class: 'case-who', text: `👤 ${who.name} utför` }) : null,
    fields.length || extra.length ? el('dl', { class: 'view-fields' },
      fields.map((fd) => [el('dt', { text: fd.name }), el('dd', { text: showVal(fd, c.f[fd.id]) })]),
      extra.map(([n, k, v]) => [el('dt', { text: n }), el('dd', { text: showVal({ kind: k }, v) })])) : t?.fields.some((fd) => fd.kind === 'days') ? null : el('p', { class: 'muted small', text: 'Inga fält ifyllda än.' }),
    (t?.fields || []).filter((fd) => fd.kind === 'days').map((fd) => daysBlock(c, fd, 'view')),
    el('p', { class: 'import-error small', id: 'c-error', role: 'alert' }),
    c.s?.length ? [el('h2', { class: 'sub-h', text: `Delmål ${done}/${all}` }),
      el('ul', { class: 'steps' }, stepOrder(c).map(([[x, d, dd, dn], i]) => el('li', { class: (d ? 'done' : '') + (!d && dd && dd < today() ? ' late' : '') },
        el('label', {}, el('input', { type: 'checkbox', checked: !!d, 'data-act': 'stog', 'data-i': i }),
          el('span', { text: x + (d ? (dn ? ` · klart ${shortDate(dn)}` : '') : dd ? ` · ${shortDate(dd)}` : '') + (!d && c.s[i][4] ? ' ↻' : '') })))))] : null,
    el('h2', { class: 'sub-h', text: 'Logg' }),
    // 2026-11-18: ✎ på varje anteckning – ändra direkt i loggen (Spara / Avbryt), ingen omväg via Redigera.
    c.l?.length ? el('ul', { class: 'log' }, [...c.l].map((x, i) => [x, i]).reverse().map(([[d, x], i]) => S.ledit === i
      ? el('li', { class: 'log-editing' }, el('span', { class: 'log-d', text: shortDate(d) }),
        el('div', { class: 'log-editbox' }, el('textarea', { id: 'le-text', class: 'log-edit', rows: Math.min(14, Math.max(3, x.split('\n').length + Math.floor(x.length / 40))), maxlength: 500, 'aria-label': 'Ändra anteckningen', text: x }),
          el('div', { class: 'row-actions' }, el('button', { class: 'link', 'data-act': 'lcancel', text: 'Avbryt' }), el('button', { class: 'primary sm', 'data-act': 'lsave', 'data-i': i, text: 'Spara' }))))
      : el('li', {}, el('span', { class: 'log-d', text: shortDate(d) }), logText(x),
        el('button', { class: 'icon sm', 'data-act': 'lopen', 'data-i': i, 'aria-label': 'Ändra anteckningen', text: '✎' })))) : null,
    el('textarea', { id: 'l-new', rows: 1, maxlength: 500, placeholder: 'Anteckning, t.ex. Ringde, fick tid 18/11', 'aria-label': 'Ny anteckning' }),
    el('div', { class: 'save-row log-add' },
      el('input', { type: 'date', id: 'l-date', class: 'step-date', value: today(), max: today(), 'aria-label': 'Datum för anteckningen' }),
      el('button', { class: 'link', 'data-act': 'ladd', text: '+ Lägg till anteckning' })),
    el('button', { class: 'primary save-case', 'data-act': 'cedit', text: '✎ Redigera' }));
}

export function caseEditor() {
  const c = S.state.cases.find((x) => x.id === S.open);
  if (!c) return null;
  const t = typeOf(S.state, c), cat = catOf(S.state, t), [done, all] = progress(c);
  return el('section', { class: `card case c-${cat.color}` },
    el('div', { class: 'add-top' },
      el('button', { class: 'icon', 'data-act': 'cedclose', 'aria-label': 'Klar med redigering', text: '✕' }),
      el('select', { class: 'cat-chip', 'data-act': 'ctype', 'aria-label': 'Typ' },
        S.state.types.filter((x) => x.on || x.id === c.t).map((x) => el('option', { value: x.id, selected: x.id === c.t, text: `${x.icon} ${x.name} · ${catOf(S.state, x).name}` })))),
    el('input', { type: 'text', id: 'c-title', class: 'case-h', maxlength: 80, value: c.title, 'aria-label': 'Rubrik', 'data-act': 'ctitle', autocomplete: 'off' }),
    el('p', { class: 'muted small', text: `Skapad ${longDate(c.c)}` + (c.x ? ` · stängd ${longDate(c.x)}` : '') }),
    personSelect(c.p, 'cperson'),
    (t?.fields || []).filter((fd) => shownField(fd, c)).map((fd) => fieldInput(c, fd)),
    el('details', { class: 'old-fields' + (c.o?.length ? '' : ' empty'), 'data-sec': 'extra', open: !!c.o?.length || setOpen.has('extra') },   // folded until used
      el('summary', { class: 'sub-h', text: c.o?.length ? `Extra fält (${c.o.length})` : '+ Extra fält' }),
      el('p', { class: 'muted small', text: 'Fält bara i det här tråden – typen ändras inte.' }),
      (c.o || []).map(([n, k, v, fr], i) => el('div', { class: 'extra' },
        fieldInput({ f: v == null ? {} : { ['o' + i]: v } }, { id: 'o' + i, name: fr ? `${n} (från ${fr})` : n, kind: k }, 'ov'),
        el('button', { class: 'icon sm', 'data-act': 'odel', 'data-i': i, 'aria-label': `Ta bort ${n}`, text: '✕' }))),
      el('div', { class: 'pick-row extra-add' },
        el('input', { type: 'text', id: 'o-name', maxlength: 40, placeholder: 'Fältnamn', 'aria-label': 'Namn på nytt fält', autocomplete: 'off' }),
        el('select', { id: 'o-kind', 'aria-label': 'Sort' }, Object.entries(KINDS).filter(([kk]) => kk !== 'days' && kk !== 'choice').map(([kk, l]) => el('option', { value: kk, text: l }))),
        el('button', { class: 'weigh-save', 'data-act': 'oadd', text: 'Lägg till' })),
      c.o?.length ? el('div', { class: 'old-actions' },
        el('button', { class: 'link', 'data-act': 'tfromcase', text: '+ Spara som ny typ' }),
        el('button', { class: 'link', 'data-act': 'oclear', text: 'Ta bort alla' })) : null),
    el('p', { class: 'import-error small', id: 'c-error', role: 'alert' }),
    el('h2', { class: 'sub-h', text: all ? `Delmål ${done}/${all}` : 'Delmål' }),
    el('ul', { class: 'steps' }, stepOrder(c).map(([[x, d, dd], i]) => el('li', { class: (d ? 'done' : '') + (!d && dd && dd < today() ? ' late' : '') },
      el('label', {}, el('input', { type: 'checkbox', checked: !!d, 'data-act': 'stog', 'data-i': i }), el('span', { text: x })),
      d ? el('input', { type: 'date', class: 'step-date done-date', value: c.s[i][3] || '', max: today(), 'data-act': 'sdate', 'data-i': i, 'aria-label': `Klart datum för ${x}` })
        : dd ? el('input', { type: 'date', class: 'step-date', value: dd, 'data-act': 'sdate', 'data-i': i, 'aria-label': `Datum för ${x}` })
        : el('label', { class: 'date-pick', title: 'Lägg till datum' }, el('span', { 'aria-hidden': 'true', text: '📅' }),   // no date yet: a calendar button, the picker on top of it
          el('input', { type: 'date', value: '', 'data-act': 'sdate', 'data-i': i, 'aria-label': `Lägg till datum för ${x}` })),
      d ? null : el('button', { class: 'icon sm rep' + (c.s[i][4] ? ' on' : ''), 'data-act': 'srep', 'data-i': i, 'aria-label': `Upprepa ${x}: ${c.s[i][4] ? REPEAT[c.s[i][4]] : 'nej'} – tryck för att byta`, text: ({ w: '↻ v', m: '↻ mån', y: '↻ år' })[c.s[i][4]] || '↻' }),
      el('button', { class: 'icon sm', 'data-act': 'sdel', 'data-i': i, 'aria-label': `Ta bort ${x}`, text: '✕' })))),
    el('div', { class: 'pick-row' },
      el('input', { type: 'text', id: 's-new', maxlength: 80, placeholder: isList(c) ? 'Varor, t.ex. mjölk, bröd' : 'Nytt delmål', 'aria-label': isList(c) ? 'Nya varor, skilj med komma' : 'Nytt delmål', autocomplete: 'off' }),
      el('input', { type: 'date', id: 's-date', class: 'step-date', 'aria-label': 'Datum för nytt delmål (valfritt)' }),
      el('button', { class: 'weigh-save add-btn', 'data-act': 'sadd', 'aria-label': 'Lägg till delmål', text: '+' })),
    el('h2', { class: 'sub-h', text: 'Logg' }),
    el('ul', { class: 'log' }, [...(c.l || [])].map((x, i) => [x, i]).reverse().map(([[d, x], i]) => el('li', {},
      // 2026-11-18: i Redigera går anteckningen att ändra direkt (sparas när du lämnar fältet).
      el('span', { class: 'log-d', text: shortDate(d) }), el('textarea', { class: 'log-edit', 'data-act': 'ledit', 'data-i': i, rows: Math.min(12, Math.max(1, x.split('\n').length + Math.floor(x.length / 40))), maxlength: 500, 'aria-label': 'Ändra anteckningen', text: x }),
      el('button', { class: 'icon sm', 'data-act': 'ldel', 'data-i': i, 'aria-label': 'Ta bort anteckningen', text: '✕' })))),
    el('textarea', { id: 'l-new', rows: 1, maxlength: 500, placeholder: 'Anteckning, t.ex. Ringde, fick tid 18/11', 'aria-label': 'Ny anteckning' }),
    el('div', { class: 'save-row log-add' },
      el('input', { type: 'date', id: 'l-date', class: 'step-date', value: today(), max: today(), 'aria-label': 'Datum för anteckningen' }),
      el('button', { class: 'link', 'data-act': 'ladd', text: '+ Lägg till anteckning' })),
    el('label', { class: 'goal-row' }, el('span', { text: 'Upprepa' }),
      el('select', { 'data-act': 'crep', id: 'c-rep' }, [['', 'Nej'], ...Object.entries(REPEAT)].map(([k, l]) => el('option', { value: k, selected: (c.r || '') === k, text: l })))),
    c.r && !c.x ? el('p', { class: 'muted small', text: 'När du arkiverar tråden skapas en ny, med alla datum flyttade ' + ({ w: 'en vecka', y: 'ett år' }[c.r] || 'en månad') + ' framåt.' }) : null,
    el('div', { class: 'row-actions case-actions' },
      el('button', { class: 'link danger', 'data-act': 'cdel', text: 'Ta bort' }),
      c.x ? el('button', { class: 'link', 'data-act': 'creopen', text: 'Öppna igen' })
        : el('button', { class: 'link', 'data-act': 'cdone', text: 'Löst – arkivera' })),
    el('button', { class: 'primary save-case', 'data-act': 'cedclose', text: 'Spara' }),
    el('p', { class: 'muted small center', text: 'Allt sparas direkt. Spara går tillbaka till visningen.' }));
}

// Markeringsläge (long press on a row), in Trådar and Arkiv. extra = the view's own button before Radera.
export function selBar(list, extra) {
  if (!S.sel) return null;
  const n = S.sel.length, allOn = list.length && list.every((c) => S.sel.includes(c.id));
  return el('div', { class: 'sel-bar', role: 'toolbar', 'aria-label': 'Markerade trådar' },
    el('button', { class: 'icon-btn', 'data-act': 'selclose', 'aria-label': 'Avsluta markering', text: '✕' }),
    el('span', { class: 'sel-n', 'aria-live': 'polite', text: `${n} ${n === 1 ? 'vald' : 'valda'}` }),
    el('button', { class: 'text-btn', 'data-act': 'selall', text: allOn ? 'Ingen' : 'Alla' }),
    extra,
    el('button', { class: 'text-btn danger', 'data-act': 'seldel', disabled: !n, text: 'Radera' }));
}
export function viewCases() {
  if (S.pick) return picker();
  if (S.tedit) return typeEditor();
  if (S.open) return caseView();
  const all = openCases(S.state), [pchips, mine] = personFilter(all, 'pfilter', 'pfilter');
  let [chips, list] = catFilter(mine, 'filter', 'filter');   // category emptied (closed, moved): back to Alla
  const [schip, srow] = sortBar('cases');
  list = sortCases(S.state, list, sortOf(S.state, 'cases'));
  if (S.sel) S.sel = S.sel.filter((id) => all.some((c) => c.id === id));
  const bar = selBar(list, el('button', { class: 'text-btn', 'data-act': 'selarch', disabled: !S.sel?.length, text: 'Arkivera' }));
  return [
    bar || filterRow(pchips, chips, schip),
    bar ? null : srow,
    list.length ? el('ul', { class: 'cases' }, list.map(caseRow))
      : el('section', { class: 'card empty-card' }, el('p', { class: 'muted', text: all.length ? 'Inga öppna trådar med det här filtret.' : 'Inga öppna trådar. Skriv ner det som snurrar i huvudet – då kan du släppa det.' })),
    S.sel ? null : el('button', { class: 'primary new-case', 'data-act': 'pickopen', text: '+ Ny tråd' }),
  ];
}
export { KINDS };
