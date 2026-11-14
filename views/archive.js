// Vy: Arkiv – stängda trådar, senast stängda först, filter per kategori och sök i rubrik. En tråd öppnas i samma lager som från Trådar.
import { closedCases, archReady } from '../store.js';
import { S, el } from '../ui.js';
import { caseRow, caseView, catFilter, personFilter, selBar } from './cases.js';
import { typeEditor } from './settings.js';

export function archiveList() {
  if (!archReady()) return el('p', { class: 'muted small', text: 'Läser in arkivet…' });
  const [, mine] = personFilter(closedCases(S.state), 'apfilter', 'apfilter'), [, byCat] = catFilter(mine, 'afilter', 'afilter');
  const q = S.q.trim().toLowerCase(), list = byCat.filter((c) => !q || c.title.toLowerCase().includes(q));
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
  return [
    el('h1', { class: 'view-title', text: 'Arkiv' }),
    bar || (all.length ? (pchips && chips.prepend(pchips), chips) : null),
    el('input', { type: 'search', id: 'arch-q', class: 'search', value: S.q, placeholder: 'Sök i stängda trådar', 'aria-label': 'Sök', autocomplete: 'off' }),
    el('div', { id: 'arch-list' }, archiveList()),
  ];
}
