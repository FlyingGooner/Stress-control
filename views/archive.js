// Vy: Arkiv – stängda ärenden, senast stängda först, filter per kategori och sök i rubrik. Ett ärende öppnas i samma lager som från Ärenden.
import { closedCases, archReady } from '../store.js';
import { S, el } from '../ui.js';
import { caseRow, caseEditor, catFilter } from './cases.js';
import { typeEditor } from './settings.js';

export function archiveList() {
  if (!archReady()) return el('p', { class: 'muted small', text: 'Läser in arkivet…' });
  const [, byCat] = catFilter(closedCases(S.state), 'afilter', 'afilter');
  const q = S.q.trim().toLowerCase(), list = byCat.filter((c) => !q || c.title.toLowerCase().includes(q));
  const shown = list.slice(0, S.alimit), more = list.length - shown.length;
  return list.length ? [el('ul', { class: 'cases' }, shown.map(caseRow)),
    more > 0 ? el('button', { class: 'link more', 'data-act': 'amore', text: `Visa fler (${more} kvar)` }) : null]
    : el('p', { class: 'muted small', text: q ? 'Ingen träff.' : 'Inga stängda ärenden än. Det du stänger sparas här.' });
}
export function viewArchive() {
  if (S.tedit) return typeEditor();
  if (S.open) return caseEditor();
  const all = closedCases(S.state), [chips] = catFilter(all, 'afilter', 'afilter');
  return [
    el('h1', { class: 'view-title', text: 'Arkiv' }),
    all.length ? chips : null,
    el('input', { type: 'search', id: 'arch-q', class: 'search', value: S.q, placeholder: 'Sök i stängda ärenden', 'aria-label': 'Sök', autocomplete: 'off' }),
    el('div', { id: 'arch-list' }, archiveList()),
  ];
}
