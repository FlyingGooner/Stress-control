// Vy: Papperskorg – ett lager från Inställningar (S.trash). Egen fil så att settings.js aldrig importerar cases.js (inga cirkulära importer).
import { purgeDate } from '../store.js';
import { S, el, shortDate } from '../ui.js';

export function viewTrash() {
  const all = [...S.state.trash].reverse(), days = S.state.trashDays;
  return el('section', { class: 'card' },
    el('div', { class: 'add-top' },
      el('button', { class: 'icon', 'data-act': 'trashclose', 'aria-label': 'Stäng', text: '✕' }),
      el('h1', { class: 'add-title', text: `Papperskorg (${all.length})` })),
    el('p', { class: 'muted small', text: days ? `Ärenden raderas ${days === 365 ? 'ett år' : days + ' dagar'} efter att de tagits bort.` : 'Ärenden raderas aldrig automatiskt.' }),
    all.length ? el('ul', { class: 'cases' }, all.map((c) => el('li', { class: 'case-li trash-li' },
      el('div', { class: 'case-main' }, el('span', { class: 'case-title', text: c.title }),
        el('small', { class: 'case-info', text: `borttaget ${shortDate(c.del)}` + (days ? ` · raderas ${shortDate(purgeDate(S.state, c))}` : '') })),
      el('div', { class: 'row-actions' },
        el('button', { class: 'link', 'data-act': 'trest', 'data-id': c.id, text: 'Återställ' }),
        el('button', { class: 'link danger', 'data-act': 'tpurge', 'data-id': c.id, text: 'Radera' }))))) : el('p', { class: 'muted', text: 'Papperskorgen är tom.' }),
    all.length ? el('div', { class: 'row-actions' }, el('button', { class: 'link danger', 'data-act': 'tempty', text: 'Töm papperskorgen' })) : null);
}
