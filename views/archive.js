// Vy: Arkiv – klara ärenden, senast klara först, sök i rubrik och beskrivning. Ett ärende öppnas i samma lager som från Ärenden.
import { closedCases, archReady } from '../store.js';
import { S, el } from '../ui.js';
import { caseRow, caseView, personFilter, catFilter } from './cases.js';

export function archiveList() {
  if (!archReady()) return el('p', { class: 'muted small', text: 'Läser in arkivet…' });
  const [, mine0] = personFilter(closedCases(S.state), 'apfilter'), [, mine] = catFilter(mine0, 'akfilter');
  const q = S.q.trim().toLowerCase(), list = mine.filter((c) => !q || [c.title, c.d || '', ...(c.s || []).map((x) => x[0]), ...(c.l || []).map((x) => x[1])].some((t) => t.toLowerCase().includes(q)));   // 2026-11-23: även delmål och anteckningar
  const shown = list.slice(0, S.alimit), more = list.length - shown.length;
  return list.length ? [el('ul', { class: 'cases' }, shown.map(caseRow)),
    more > 0 ? el('button', { class: 'link more', 'data-act': 'amore', text: `Visa fler (${more} kvar)` }) : null]
    : el('p', { class: 'muted small', text: q ? 'Ingen träff.' : 'Inga klara ärenden än. Det du markerar som klart sparas här.' });
}
export function viewArchive() {
  if (S.open) return caseView();
  S.apfilter ??= 'all';
  const [psel, mine] = personFilter(closedCases(S.state), 'apfilter'), [ksel] = catFilter(mine, 'akfilter');
  return [
    el('h1', { class: 'view-title', text: 'Arkiv' }),
    psel || ksel ? el('div', { class: 'filter-row' }, psel, ksel) : null,
    el('input', { type: 'search', id: 'arch-q', class: 'search', value: S.q, placeholder: 'Sök i klara ärenden, delmål och anteckningar', 'aria-label': 'Sök', autocomplete: 'off' }),
    el('div', { id: 'arch-list' }, archiveList()),
  ];
}
