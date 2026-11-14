// Vy: Arkiv – stängda ärenden, senast stängda först, sök i rubrik. Ett ärende öppnas i samma lager som från Ärenden.
import { closedCases, purgeDate, TRASH_DAYS } from '../store.js';
import { S, el, longDate, setOpen } from '../ui.js';
import { caseRow, caseEditor } from './cases.js';
import { typeEditor } from './settings.js';
const setOpenTrash = () => setOpen.has('trash');

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
    trashCard(),
  ];
}
// Papperskorg: removed cases, newest first. Återställ puts the case back (open or in Arkiv); Radera removes it for good.
function trashCard() {
  const tr = [...S.state.trash].reverse(), days = S.state.trashDays;
  return el('details', { class: 'card trash', 'data-sec': 'trash', open: setOpenTrash() },
    el('summary', { text: `🗑️ Papperskorg (${tr.length})` }),
    el('label', { class: 'goal-row' }, el('span', { text: 'Raderas efter' }),
      el('select', { 'data-act': 'trashdays', 'aria-label': 'Raderas efter' }, TRASH_DAYS.map((d) => el('option', { value: d, selected: d === days, text: d ? (d === 365 ? '1 år' : `${d} dagar`) : 'Aldrig' })))),
    tr.length ? el('ul', { class: 'trash-list' }, tr.map((c) => el('li', {},
      el('span', { class: 'case-main' }, el('span', { class: 'case-title', text: c.title }),
        el('small', { class: 'muted', text: `Borttaget ${longDate(c.d)}` + (days ? ` · raderas ${longDate(purgeDate(S.state, c))}` : '') })),
      el('button', { class: 'link', 'data-act': 'trest', 'data-id': c.id, text: 'Återställ' }),
      el('button', { class: 'link danger', 'data-act': 'tpurge', 'data-id': c.id, 'aria-label': `Radera ${c.title} för gott`, text: 'Radera' }))))
      : el('p', { class: 'muted small', text: 'Tom. Ärenden du tar bort hamnar här och kan återställas.' }),
    tr.length ? el('div', { class: 'row-actions' }, el('button', { class: 'link danger', 'data-act': 'tempty', text: 'Töm papperskorgen' })) : null);
}
