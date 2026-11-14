// Vy: Arkiv – stängda ärenden, senast stängda först, sök i rubrik. Ett ärende öppnas i samma lager som från Ärenden.
import { closedCases } from '../store.js';
import { S, el } from '../ui.js';
import { caseRow, caseEditor } from './cases.js';
import { typeEditor } from './settings.js';

export function archiveList() {
  const q = S.q.trim().toLowerCase(), list = closedCases(S.state).filter((c) => !q || c.title.toLowerCase().includes(q));
  return list.length ? el('ul', { class: 'cases' }, list.map(caseRow))
    : el('p', { class: 'muted small', text: q ? 'Ingen träff.' : 'Inga stängda ärenden än. Det du stänger sparas här.' });
}
export function viewArchive() {
  if (S.tedit) return typeEditor();
  if (S.open) return caseEditor();
  return [
    el('h1', { class: 'view-title', text: 'Arkiv' }),
    el('input', { type: 'search', id: 'arch-q', class: 'search', value: S.q, placeholder: 'Sök i stängda ärenden', 'aria-label': 'Sök', autocomplete: 'off' }),
    el('div', { id: 'arch-list' }, archiveList()),
  ];
}
