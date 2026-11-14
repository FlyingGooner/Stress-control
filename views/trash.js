// Vy: Papperskorg – ett lager från Inställningar (S.trash). Egen fil så att settings.js aldrig importerar cases.js (inga cirkulära importer).
import { purgeDate, typeOf, catOf } from '../store.js';
import { S, el, shortDate } from '../ui.js';
import { caseSummary, catFilter } from './cases.js';

// Papperskorg (a layer from Inställningar): removed cases, newest first, with filter and the same summary as in the lists.
export function viewTrash() {
  const all = [...S.state.trash].reverse(), [chips, list] = catFilter(all, 'tfilter', 'tfilter'), days = S.state.trashDays;
  return el('section', { class: 'card' },
    el('div', { class: 'add-top' },
      el('button', { class: 'icon', 'data-act': 'trashclose', 'aria-label': 'Stäng', text: '✕' }),
      el('h1', { class: 'add-title', text: `Papperskorg (${all.length})` })),
    el('p', { class: 'muted small', text: days ? `Ärenden raderas ${days === 365 ? 'ett år' : days + ' dagar'} efter att de tagits bort. Ändra under Inställningar → Papperskorg.` : 'Ärenden raderas aldrig automatiskt.' }),
    all.length ? chips : null,
    list.length ? el('ul', { class: 'cases' }, list.map((c) => {
      const t = typeOf(S.state, c), cat = catOf(S.state, t), open = S.exp === c.id;
      return el('li', { class: `case-li c-${cat.color}` + (open ? ' open' : '') },
        el('div', { class: 'case-line' }, el('button', { class: `case-row c-${cat.color}`, 'data-act': 'cexp', 'data-id': c.id, 'aria-expanded': String(open) },
          el('span', { class: 'case-icon', 'aria-hidden': 'true', text: t?.icon || '📌' }),
          el('span', { class: 'case-main' }, el('span', { class: 'case-title', text: c.title }),
            el('small', { text: `${t?.name ?? 'Okänd typ'} · borttaget ${shortDate(c.d)}` + (days ? ` · raderas ${shortDate(purgeDate(S.state, c))}` : '') }))),
          el('button', { class: 'case-chev', 'data-act': 'cexp', 'data-id': c.id, 'aria-expanded': String(open), 'aria-label': open ? `Dölj ${c.title}` : `Visa ${c.title}`, text: open ? '▴' : '▾' })),
        open ? caseSummary(c, t, cat, el('div', { class: 'row-actions' },
          el('button', { class: 'link danger', 'data-act': 'tpurge', 'data-id': c.id, text: 'Radera för gott' }),
          el('button', { class: 'link', 'data-act': 'trest', 'data-id': c.id, text: c.x ? 'Återställ till Arkiv' : 'Återställ' }))) : null);
    })) : el('p', { class: 'muted', text: 'Papperskorgen är tom.' }),
    all.length ? el('div', { class: 'row-actions' }, el('button', { class: 'link danger', 'data-act': 'tempty', text: 'Töm papperskorgen' })) : null);
}
