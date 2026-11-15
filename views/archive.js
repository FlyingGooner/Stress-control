// Vy: Arkiv – stängda trådar, senast stängda först, filter per kategori och sök i rubrik. En tråd öppnas i samma lager som från Trådar.
import { closedCases, archReady, sortCases, sortOf } from '../store.js';
import { S, el } from '../ui.js';
import { caseRow, caseView, catFilter, filterRow, personFilter, selBar, sortBar } from './cases.js';
import { typeEditor } from './settings.js';

export function archiveList() {
  if (!archReady()) return el('p', { class: 'muted small', text: 'Läser in arkivet…' });
  const [, mine] = personFilter(closedCases(S.state), 'apfilter', 'apfilter'), [, byCat] = catFilter(mine, 'afilter', 'afilter');
  const q = S.q.trim().toLowerCase(), list = sortCases(S.state, byCat.filter((c) => !q || c.title.toLowerCase().includes(q)), sortOf(S.state, 'arch'));
  const shown = list.slice(0, S.alimit), more = list.length - shown.length;
  return list.length ? [el('ul', { class: 'cases' }, shown.map(caseRow)),
    more > 0 ? el('button', { class: 'link more', 'data-act': 'amore', text: `Visa fler (${more} kvar)` }) : null]
    : el('p', { class: 'muted small', text: q ? 'Ingen träff.' : 'Inga stängda trådar än. Det du stänger sparas här.' });
}
export function viewArchive() {
  if (S.tedit) return typeEditor();
  if (S.open) return caseView();
  const all = closedCases(S.state), [pchips, mine] = personFilter(all, 'apfilter', 'apfilter'), [chips, byCat] = catFilter(mine, 'afilter', 'afilter');
  if (S.sel) { S.sel = S.sel.filter((id) => all.some((c) => c.id === id)); if (!S.sel.length) S.sel = null; }
  const bar = selBar(byCat, el('button', { class: 'text-btn', 'data-act': 'selreopen', disabled: !S.sel?.length, text: 'Öppna igen' }));
  const [schip, srow] = sortBar('arch');
  return [
    el('h1', { class: 'view-title', text: 'Arkiv' }),
    bar || (all.length ? filterRow(pchips, chips, schip) : null),
    bar || !all.length ? null : srow,
    el('input', { type: 'search', id: 'arch-q', class: 'search', value: S.q, placeholder: 'Sök i stängda trådar', 'aria-label': 'Sök', autocomplete: 'off' }),
    el('div', { id: 'arch-list' }, archiveList()),
  ];
}
