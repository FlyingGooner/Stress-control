// Vy: Ärenden (öppna ärenden, närmast deadline först), Nytt ärende (rubrik + mallar) och ärendet (lager – Bakåt stänger).
// Ärendet används också från Arkiv. 2026-11-22: omgjord – rubrik, beskrivning, deadline, person, delmål och logg; allt sparas direkt.
import { openCases, personOf, catOf, colorName, COLORS, COLOR_DOTS, progress, daysBetween, parseKey, dueDay, LOG_CHARS, DESC_CHARS, TITLE_CHARS, STEP_CHARS } from '../store.js';
import { today, S, el, shortDate, cur } from '../ui.js';

// Deadline som text: "idag 14:00", "imorgon", "fre", "28/11", "3 dagar sen".
export function dueText(due, t = today()) {
  if (!due) return '';
  const d = dueDay({ due }), n = daysBetween(t, d), time = due.length > 10 ? ' ' + due.slice(11) : '';
  const day = n < -1 ? `${-n} dagar sen` : n === -1 ? 'igår' : n === 0 ? 'idag' : n === 1 ? 'imorgon'
    : n < 7 ? parseKey(d).toLocaleDateString('sv-SE', { weekday: 'short' }).replace('.', '') : shortDate(d);
  return day + time;
}
const dueClass = (c) => (c.x || !c.due ? '' : dueDay(c) < today() ? ' late' : dueDay(c) === today() ? ' soon' : '');

export function caseRow(c) {
  const [done, all] = progress(c), who = personOf(S.state, c), cat = catOf(S.state, c);
  const info = [cat?.label || null, c.x ? `✓ klar ${shortDate(c.x)}` : c.due ? `📅 ${dueText(c.due)}` : 'ingen deadline', who ? `👤 ${who.name}` : null].filter(Boolean).join(' · ');
  return el('li', { class: 'case-li' + dueClass(c) + (cat ? ` c-${cat.color}` : '') },
    el('button', { class: 'case-row', 'data-act': 'copen', 'data-id': c.id },
      el('span', { class: 'case-main' }, el('span', { class: 'case-title', text: c.title }), el('small', { class: 'case-info', text: info })),
      all ? el('span', { class: 'case-prog', 'aria-label': `${done} av ${all} delmål klara`, text: `${done}/${all}` }) : null));
}
// Färgfilter (bara när några ärenden har färg). '-' = utan färg.
export function catFilter(list, key) {
  const n = (k) => list.filter((c) => (k === '-' ? !c.k : c.k === k)).length, used = COLORS.filter((k) => n(k));
  S[key] ??= 'all';
  if (S[key] !== 'all' && !n(S[key])) S[key] = 'all';
  if (!used.length) return [null, list];
  const sel = el('select', { class: 'filt' + (COLORS.includes(S[key]) ? ` on c-${S[key]}` : S[key] === '-' ? ' on' : ''), 'data-act': key, 'aria-label': 'Färg' },
    el('option', { value: 'all', selected: S[key] === 'all', text: `Alla färger (${list.length})` }),
    used.map((k) => el('option', { value: k, selected: S[key] === k, text: `${COLOR_DOTS[k]} ${colorName(S.state, k)} (${n(k)})` })),
    n('-') ? el('option', { value: '-', selected: S[key] === '-', text: `Utan färg (${n('-')})` }) : null);
  return [sel, list.filter((c) => S[key] === 'all' || (S[key] === '-' ? !c.k : c.k === S[key]))];
}
// Personfilter (bara när det finns personer).
export function personFilter(list, key) {
  if (!S.state.people.length) return [null, list];
  if (S[key] !== 'all' && S[key] !== '-' && !S.state.people.some((p) => p.id === S[key])) S[key] = 'all';
  const sel = el('select', { class: 'filt' + (S[key] !== 'all' ? ' on' : ''), 'data-act': key, 'aria-label': 'Person' },
    el('option', { value: 'all', selected: S[key] === 'all', text: '👤 Alla' }),
    S.state.people.map((p) => el('option', { value: p.id, selected: S[key] === p.id, text: `👤 ${p.name}` })),
    el('option', { value: '-', selected: S[key] === '-', text: '👤 Ingen' }));
  return [sel, list.filter((c) => S[key] === 'all' || (S[key] === '-' ? !c.p : c.p === S[key]))];
}

const rows = (x, min = 1, max = 14) => Math.min(max, Math.max(min, x.split('\n').length + Math.floor(x.length / 38)));
export function caseView() {
  const c = cur();
  if (!c) return null;
  const isNew = c === S.draft, col = catOf(S.state, c);
  const [done, all] = progress(c), dd = c.due ? c.due.slice(0, 10) : '', tt = c.due && c.due.length > 10 ? c.due.slice(11) : '';
  return el('section', { class: 'card case' + dueClass(c) + (catOf(S.state, c) ? ` c-${catOf(S.state, c).color}` : '') },
    el('div', { class: 'add-top' },
      el('button', { class: 'icon', 'data-act': 'cclose', 'aria-label': 'Stäng', text: '✕' }),
      // Färg (2026-11-22): en prick – tryck för att välja; vad färgen betyder skrivs i samma ruta.
      el('details', { class: 'color-pick' },
        el('summary', { class: 'color-dot' + (col ? ` c-${col.color}` : ' none'), 'aria-label': col ? `Färg: ${col.name}` : 'Välj färg', text: col ? '' : '🎨' }),
        el('div', { class: 'color-pop' },
          el('div', { class: 'color-row', role: 'radiogroup', 'aria-label': 'Färg' },
            COLORS.map((k) => el('button', { class: `color-dot c-${k}` + (c.k === k ? ' on' : ''), 'data-act': 'ccol', 'data-id': k, role: 'radio', 'aria-checked': String(c.k === k), 'aria-label': colorName(S.state, k) })),
            el('button', { class: 'color-dot none' + (c.k ? '' : ' on'), 'data-act': 'ccol', 'data-id': '', role: 'radio', 'aria-checked': String(!c.k), 'aria-label': 'Ingen färg', text: '⊘' })),
          c.k ? el('input', { type: 'text', class: 'color-label', maxlength: 30, value: S.state.labels[c.k] || '', placeholder: 'Vad betyder färgen? (valfritt)', 'aria-label': 'Vad färgen betyder', 'data-act': 'clabel', 'data-id': c.k, autocomplete: 'off' }) : null)),
      c.x ? el('span', { class: 'cat-chip', text: `✓ Klar ${shortDate(c.x)}` }) : null),
    el('input', { type: 'text', id: 'c-title', class: 'case-h', maxlength: TITLE_CHARS, value: c.title, placeholder: 'Rubrik, t.ex. Fixa markisen', 'aria-label': 'Rubrik', 'data-act': 'ctitle', autocomplete: 'off' }),
    // Nytt ärende: mallarna under rubriken tills något är ifyllt.
    isNew && !c.title && !c.d && !c.s && S.state.tpls.length ? el('div', { class: 'tpl-chips' }, el('span', { class: 'muted small', text: 'Från mall:' }),
      S.state.tpls.map((t) => el('button', { class: 'chip', 'data-act': 'cfromtpl', 'data-id': t.id, text: t.title }))) : null,
    el('textarea', { id: 'c-desc', class: 'case-desc', 'data-act': 'cdesc', maxlength: DESC_CHARS, rows: rows(c.d || '', 3), placeholder: 'Kort beskrivning – vad det gäller, kontakter, pris', 'aria-label': 'Beskrivning', text: c.d || '' }),
    el('div', { class: 'due-row' },
      el('span', { class: 'due-label', text: 'Deadline' }),
      el('input', { type: 'date', class: 'due-date' + (dd ? '' : ' empty'), value: dd, 'data-act': 'cdue', 'aria-label': 'Deadline, datum' }),
      el('input', { type: 'time', class: 'due-time' + (tt ? '' : ' empty'), value: tt, 'data-act': 'cdue', disabled: !dd, 'aria-label': 'Deadline, tid (valfri)' }),
      c.due ? el('button', { class: 'icon sm', 'data-act': 'cdueclr', 'aria-label': 'Ta bort deadline', text: '✕' }) : null),
    c.due && !c.x ? el('p', { class: 'muted small due-when', text: `📅 ${dueText(c.due)}` }) : null,
    S.state.people.length ? el('label', { class: 'goal-row' }, el('span', { text: 'Vem' }),
      el('select', { 'data-act': 'cperson', 'aria-label': 'Vem utför' }, el('option', { value: '', selected: !c.p, text: 'Ingen' }),
        S.state.people.map((p) => el('option', { value: p.id, selected: c.p === p.id, text: p.name })))) : null,
    el('p', { class: 'import-error small', id: 'c-error', role: 'alert' }),
    el('h2', { class: 'sub-h', text: all ? `Delmål ${done}/${all}` : 'Delmål' }),
    el('ul', { class: 'steps' }, (c.s || []).map(([x, d], i) => el('li', { class: d ? 'done' : '' },
      el('label', {}, el('input', { type: 'checkbox', checked: !!d, 'data-act': 'stog', 'data-i': i }), el('span', { text: x })),
      el('button', { class: 'icon sm', 'data-act': 'sdel', 'data-i': i, 'aria-label': `Ta bort ${x}`, text: '✕' })))),
    el('div', { class: 'pick-row' },
      el('input', { type: 'text', id: 's-new', maxlength: STEP_CHARS, placeholder: 'Nytt delmål', 'aria-label': 'Nytt delmål', autocomplete: 'off' }),
      el('button', { class: 'weigh-save', 'data-act': 'sadd', text: 'Lägg till' })),
    el('h2', { class: 'sub-h', text: 'Anteckningar' }),
    el('textarea', { id: 'l-new', rows: 2, maxlength: LOG_CHARS, placeholder: 'Ny anteckning, t.ex. Ringde, fick tid 18/11', 'aria-label': 'Ny anteckning' }),
    el('div', { class: 'save-row log-add' }, el('button', { class: 'link', 'data-act': 'ladd', text: '+ Lägg till anteckning' })),
    el('ul', { class: 'log' }, [...(c.l || [])].map((x, i) => [x, i]).reverse().map(([[d, x], i]) => el('li', {},
      el('span', { class: 'log-d', text: shortDate(d) }),
      el('textarea', { class: 'log-edit', 'data-act': 'ledit', 'data-i': i, rows: rows(x), maxlength: LOG_CHARS, 'aria-label': 'Ändra anteckningen', text: x }),
      el('button', { class: 'icon sm', 'data-act': 'ldel', 'data-i': i, 'aria-label': 'Ta bort anteckningen', text: '✕' })))),
    isNew ? el('p', { class: 'muted small center', text: 'Ärendet sparas när det har en rubrik.' }) : [
      el('button', { class: 'primary save-case', 'data-act': c.x ? 'creopen' : 'cdone', text: c.x ? 'Öppna igen' : '✓ Klar' }),
      el('div', { class: 'row-actions case-actions' },
        el('button', { class: 'link danger', 'data-act': 'cdel', text: 'Ta bort' }),
        el('button', { class: 'link', 'data-act': 'tsave', text: 'Spara som mall' })),
      el('p', { class: 'muted small center', text: 'Allt sparas direkt.' })]);
}

export function viewCases() {
  if (S.open) return caseView();
  const all = openCases(S.state), [psel, mine] = personFilter(all, 'pfilter'), [ksel, list] = catFilter(mine, 'kfilter');
  return [
    el('h1', { class: 'view-title', text: 'Ärenden' }),
    psel || ksel ? el('div', { class: 'filter-row' }, psel, ksel) : null,
    list.length ? el('ul', { class: 'cases' }, list.map(caseRow))
      : el('p', { class: 'muted', text: all.length ? 'Inga ärenden med det filtret.' : 'Inga öppna ärenden. Tryck + Nytt ärende för att lägga till ett.' }),
    el('button', { class: 'primary new-case', 'data-act': 'pickopen', text: '+ Nytt ärende' }),
  ];
}
