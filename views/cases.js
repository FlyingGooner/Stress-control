// Vy: Ärenden (öppna ärenden, filter per kategori), typväljaren och ärendet (lager – Bakåt stänger). Ärendet används också från Arkiv.
import { openCases, typeOf, catOf, progress, daysBetween, KINDS, REPEAT } from '../store.js';
import { today, S, el, shortDate, longDate } from '../ui.js';
import { typeEditor } from './settings.js';

const ago = (k) => { const d = daysBetween(k, today()); return d <= 0 ? 'idag' : d === 1 ? 'igår' : `${d} dagar`; };
// A case row: coloured edge = category (CSS class from a fixed list, never a colour from data).
export function caseRow(c) {
  const t = typeOf(S.state, c), cat = catOf(S.state, t), [done, all] = progress(c), open = S.exp === c.id;
  return el('li', { class: `case-li c-${cat.color}` + (open ? ' open' : '') }, el('div', { class: 'case-line' }, el('button', { class: `case-row c-${cat.color}`, 'data-act': 'copen', 'data-id': c.id },
    el('span', { class: 'case-icon', 'aria-hidden': 'true', text: t?.icon || '📌' }),
    el('span', { class: 'case-main' }, el('span', { class: 'case-title', text: c.title }),
      el('small', { text: `${t?.name ?? 'Okänd typ'} · ${c.x ? 'stängt ' + shortDate(c.x) : 'ändrat ' + ago(c.u)}` })),
    all ? el('span', { class: 'case-prog', 'aria-label': `${done} av ${all} delmål klara`, text: `${done}/${all}` }) : null,
    ),
    el('button', { class: 'case-chev', 'data-act': 'cexp', 'data-id': c.id, 'aria-expanded': String(open), 'aria-label': open ? `Dölj sammanfattning av ${c.title}` : `Visa sammanfattning av ${c.title}`, text: open ? '▴' : '▾' })),
    open ? caseSummary(c, t, cat) : null);
}
// Read-only summary under a row: filled fields, sub-goals and the latest notes, then Öppna ärendet.
export const showVal = (fd, v) => fd.kind === 'check' ? 'Ja' : fd.kind === 'date' ? longDate(v) : fd.kind === 'dt' ? `${longDate(v.slice(0, 10))} ${v.slice(11)}` : fd.kind === 'num' ? Number(v).toLocaleString('sv-SE') : String(v);
export function caseSummary(c, t, cat, actions) {
  const fields = (t?.fields || []).filter((fd) => c.f?.[fd.id] !== undefined);
  const log = (c.l || []).slice(-3).reverse();
  return el('div', { class: `case-sum c-${cat.color}` },
    fields.length ? el('dl', {}, fields.map((fd) => [el('dt', { text: fd.name }), el('dd', { text: showVal(fd, c.f[fd.id]) })])) : c.o?.some((x) => x[2] != null) ? null : el('p', { class: 'muted small', text: 'Inga fält ifyllda än.' }),
    c.o?.some((x) => x[2] != null) ? el('dl', { class: 'sum-old' }, c.o.filter((x) => x[2] != null).map(([n, k, v]) => [el('dt', { text: n }), el('dd', { text: showVal({ kind: k }, v) })])) : null,
    c.s?.length ? el('ul', { class: 'sum-steps' }, c.s.map(([x, d, dd]) => el('li', { class: d ? 'done' : '', text: (d ? '✓ ' : '○ ') + x + (dd ? ` · ${shortDate(dd)}` : '') }))) : null,
    log.length ? el('ul', { class: 'sum-log' }, log.map(([d, x]) => el('li', {}, el('small', { text: shortDate(d) + ' ' }), el('span', { text: x })))) : null,
    actions || el('button', { class: 'sum-open', 'data-act': 'copen', 'data-id': c.id, text: 'Öppna ärendet →' }));
}
// Category chips over a list of cases (Ärenden, Arkiv, Papperskorg). key = the S property holding the filter, act = its data-act.
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

// Nytt ärende in one step: rubrik, typ, and the chosen type's own fields right below (draft S.draft, saved on Skapa).
function picker() {
  const types = S.state.types.filter((t) => t.on), d = S.draft, dt = d && types.find((t) => t.id === d.t);
  return el('section', { class: 'card' },
    el('div', { class: 'add-top' },
      el('button', { class: 'icon', 'data-act': 'pickclose', 'aria-label': 'Stäng', text: '✕' }),
      el('h1', { class: 'add-title', text: 'Nytt ärende' })),
    el('input', { type: 'text', id: 'new-title', class: 'search', maxlength: 80, value: S.newTitle, placeholder: 'Rubrik, t.ex. Ont i knät', 'aria-label': 'Rubrik', autocomplete: 'off' }),
    el('p', { class: 'import-error small', id: 'new-error', role: 'alert' }),
    el('p', { class: 'muted small', text: 'Välj typ – fälten visas under. Fyll i det du vet, resten kan vänta.' }),
    el('ul', { class: 'type-grid' }, types.map((t) => el('li', {}, el('button', { class: `type-btn c-${catOf(S.state, t).color}` + (dt === t ? ' on' : ''), 'data-act': 'ptype', 'data-id': t.id, 'aria-pressed': String(dt === t) },
      el('span', { class: 'case-icon', 'aria-hidden': 'true', text: t.icon }), el('span', { text: t.name }))))),
    dt ? el('div', { class: `draft c-${catOf(S.state, dt).color}` },
      el('h2', { class: 'sub-h', text: `${dt.icon} ${dt.name}` }),
      dt.fields.map((fd) => fieldInput(d, fd, 'dv')),
      el('p', { class: 'import-error small', id: 'd-error', role: 'alert' }),
      dt.steps?.length ? [el('h2', { class: 'sub-h', text: 'Delmål' }),
        el('p', { class: 'muted small', text: 'Förslag från typen. Bocka ur det du inte behöver – ändra förslagen under Inställningar → Ärendetyper.' }),
        el('ul', { class: 'steps' }, dt.steps.map((x, i) => el('li', {}, el('label', {},
          el('input', { type: 'checkbox', checked: !(d.skip || []).includes(i), 'data-act': 'dstep', 'data-i': i }), el('span', { text: x })))))] : null,
      el('button', { class: 'primary', 'data-act': 'cnew', 'data-id': dt.id, text: 'Skapa ärende' })) : null,
    el('p', { class: 'muted small', text: 'Fler typer, och egna, under Inställningar → Ärendetyper.' }));
}

function fieldInput(c, fd, act = 'fv') {
  const v = c.f?.[fd.id], id = 'f-' + fd.id, common = { id, 'data-act': act, 'data-id': fd.id, autocomplete: 'off' };
  const label = (...kids) => el('label', { class: 'cfield' + (fd.kind === 'check' ? ' cfield-check' : '') }, kids);
  switch (fd.kind) {
    case 'check': return label(el('input', { ...common, type: 'checkbox', checked: v === 1 }), el('span', { text: fd.name }));
    case 'note': return label(el('span', { text: fd.name }), el('textarea', { ...common, rows: 3, maxlength: 2000, text: v ?? '' }));
    case 'date': return label(el('span', { text: fd.name }), el('input', { ...common, type: 'date', value: v ?? '' }));
    case 'dt': return label(el('span', { text: fd.name }), el('input', { ...common, type: 'datetime-local', value: v ?? '' }));
    case 'num': return label(el('span', { text: fd.name }), el('input', { ...common, type: 'text', inputmode: 'decimal', value: v != null ? String(v).replace('.', ',') : '' }));
    default: return label(el('span', { text: fd.name }), el('input', { ...common, type: 'text', maxlength: 200, value: v ?? '' }));
  }
}

export function caseEditor() {
  const c = S.state.cases.find((x) => x.id === S.open);
  if (!c) return null;
  const t = typeOf(S.state, c), cat = catOf(S.state, t), [done, all] = progress(c);
  return el('section', { class: `card case c-${cat.color}` },
    el('div', { class: 'add-top' },
      el('button', { class: 'icon', 'data-act': 'cclose', 'aria-label': 'Stäng', text: '✕' }),
      el('select', { class: 'cat-chip', 'data-act': 'ctype', 'aria-label': 'Typ' },
        S.state.types.filter((x) => x.on || x.id === c.t).map((x) => el('option', { value: x.id, selected: x.id === c.t, text: `${x.icon} ${x.name} · ${catOf(S.state, x).name}` })))),
    el('input', { type: 'text', id: 'c-title', class: 'case-h', maxlength: 80, value: c.title, 'aria-label': 'Rubrik', 'data-act': 'ctitle', autocomplete: 'off' }),
    el('p', { class: 'muted small', text: `Skapat ${longDate(c.c)}` + (c.x ? ` · stängt ${longDate(c.x)}` : '') }),
    (t?.fields || []).map((fd) => fieldInput(c, fd)),
    el('section', { class: 'old-fields' + (c.o?.length ? '' : ' empty') },
      el('h2', { class: 'sub-h', text: 'Extra fält' }),
      el('p', { class: 'muted small', text: c.o?.length ? 'Bara i det här ärendet. Typen ändras inte.' : 'Behöver du något typen saknar? Lägg till ett fält bara i det här ärendet.' }),
      (c.o || []).map(([n, k, v, fr], i) => el('div', { class: 'extra' },
        fieldInput({ f: v == null ? {} : { ['o' + i]: v } }, { id: 'o' + i, name: fr ? `${n} (från ${fr})` : n, kind: k }, 'ov'),
        el('button', { class: 'icon sm', 'data-act': 'odel', 'data-i': i, 'aria-label': `Ta bort ${n}`, text: '✕' }))),
      el('div', { class: 'pick-row extra-add' },
        el('input', { type: 'text', id: 'o-name', maxlength: 40, placeholder: 'Fältnamn', 'aria-label': 'Namn på nytt fält', autocomplete: 'off' }),
        el('select', { id: 'o-kind', 'aria-label': 'Sort' }, Object.entries(KINDS).map(([kk, l]) => el('option', { value: kk, text: l }))),
        el('button', { class: 'weigh-save', 'data-act': 'oadd', text: 'Lägg till' })),
      c.o?.length ? el('div', { class: 'old-actions' },
        el('button', { class: 'link', 'data-act': 'tfromcase', text: '+ Spara som ny ärendetyp' }),
        el('button', { class: 'link', 'data-act': 'oclear', text: 'Ta bort alla' })) : null),
    el('p', { class: 'import-error small', id: 'c-error', role: 'alert' }),
    el('h2', { class: 'sub-h', text: all ? `Delmål ${done}/${all}` : 'Delmål' }),
    el('ul', { class: 'steps' }, (c.s || []).map(([x, d, dd], i) => el('li', { class: (d ? 'done' : '') + (!d && dd && dd < today() ? ' late' : '') },
      el('label', {}, el('input', { type: 'checkbox', checked: !!d, 'data-act': 'stog', 'data-i': i }), el('span', { text: x })),
      el('input', { type: 'date', class: 'step-date' + (dd ? '' : ' empty'), value: dd || '', 'data-act': 'sdate', 'data-i': i, 'aria-label': `Datum för ${x}` }),
      el('button', { class: 'icon sm', 'data-act': 'sdel', 'data-i': i, 'aria-label': `Ta bort ${x}`, text: '✕' })))),
    el('div', { class: 'pick-row' },
      el('input', { type: 'text', id: 's-new', maxlength: 80, placeholder: 'Nytt delmål', 'aria-label': 'Nytt delmål', autocomplete: 'off' }),
      el('input', { type: 'date', id: 's-date', class: 'step-date', 'aria-label': 'Datum för nytt delmål (valfritt)' }),
      el('button', { class: 'weigh-save', 'data-act': 'sadd', text: 'Lägg till' })),
    el('h2', { class: 'sub-h', text: 'Logg' }),
    el('ul', { class: 'log' }, [...(c.l || [])].map((x, i) => [x, i]).reverse().map(([[d, x], i]) => el('li', {},
      el('span', { class: 'log-d', text: shortDate(d) }), el('span', { class: 'log-x', text: x }),
      el('button', { class: 'icon sm', 'data-act': 'ldel', 'data-i': i, 'aria-label': 'Ta bort anteckningen', text: '✕' })))),
    el('textarea', { id: 'l-new', rows: 2, maxlength: 500, placeholder: 'Anteckning, t.ex. Ringde, fick tid 18/11', 'aria-label': 'Ny anteckning' }),
    el('div', { class: 'save-row log-add' },
      el('input', { type: 'date', id: 'l-date', class: 'step-date', value: today(), max: today(), 'aria-label': 'Datum för anteckningen' }),
      el('button', { class: 'link', 'data-act': 'ladd', text: '+ Lägg till anteckning' })),
    el('label', { class: 'cfield' }, el('span', { text: 'Upprepa' }),
      el('select', { 'data-act': 'crep', id: 'c-rep' }, [['', 'Nej'], ...Object.entries(REPEAT)].map(([k, l]) => el('option', { value: k, selected: (c.r || '') === k, text: l })))),
    c.r && !c.x ? el('p', { class: 'muted small', text: 'När du arkiverar ärendet skapas ett nytt, med alla datum flyttade ' + (c.r === 'y' ? 'ett år' : 'en månad') + ' framåt.' }) : null,
    el('div', { class: 'row-actions case-actions' },
      el('button', { class: 'link danger', 'data-act': 'cdel', text: 'Ta bort' }),
      c.x ? el('button', { class: 'link', 'data-act': 'creopen', text: 'Öppna igen' })
        : el('button', { class: 'link', 'data-act': 'cdone', text: 'Löst – arkivera' })),
    el('button', { class: 'primary save-case', 'data-act': 'cclose', text: 'Spara' }),
    el('p', { class: 'muted small center', text: 'Allt sparas direkt. Spara stänger ärendet och tar dig tillbaka till listan – det ligger kvar som öppet.' }));
}

export function viewCases() {
  if (S.pick) return picker();
  if (S.tedit) return typeEditor();
  if (S.open) return caseEditor();
  const all = openCases(S.state), [chips, list] = catFilter(all, 'filter', 'filter');   // category emptied (closed, moved): back to Alla
  return [
    chips,
    list.length ? el('ul', { class: 'cases' }, list.map(caseRow))
      : el('section', { class: 'card empty-card' }, el('p', { class: 'muted', text: all.length ? 'Inga öppna ärenden i den här kategorin.' : 'Inga öppna ärenden. Skriv ner det som snurrar i huvudet – då kan du släppa det.' })),
    el('button', { class: 'primary new-case', 'data-act': 'pickopen', text: '+ Nytt ärende' }),
  ];
}
export { KINDS };
