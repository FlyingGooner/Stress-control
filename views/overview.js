// Vy: Överblick – öppna ärenden per kategori, äldsta öppna, stängda senaste 30 dagarna, öppna delmål.
import { overview, daysBetween } from '../store.js';
import { today, S, el, shortDate } from '../ui.js';
import { caseRow } from './cases.js';

export function viewOverview() {
  const o = overview(S.state, today()), max = Math.max(1, ...o.per.map((x) => x.n));
  const stat = (n, label) => el('div', { class: 'stat' }, el('span', { class: 'stat-n', text: String(n) }), el('span', { text: label }));
  return [
    el('h1', { class: 'view-title', text: 'Överblick' }),
    el('section', { class: 'card stats3' }, stat(o.open, 'öppna ärenden'), stat(o.steps, 'delmål kvar'), stat(o.closed30, 'stängda, 30 dagar')),
    el('section', { class: 'card' }, el('h2', { text: 'Per kategori' }),
      el('ul', { class: 'bars' }, o.per.map(({ cat, n }) => el('li', { class: `c-${cat.color}` },
        el('span', { class: 'bar-name', text: cat.name }),
        el('progress', { max, value: n, 'aria-label': `${cat.name}: ${n} öppna` }),
        el('span', { class: 'bar-n', text: String(n) }))))),
    o.oldest ? el('section', { class: 'card' }, el('h2', { text: `Äldsta öppna – ${daysBetween(o.oldest.c, today())} dagar` }),
      el('p', { class: 'muted small', text: `Skapat ${shortDate(o.oldest.c)}. Kan något göras idag, eller kan det stängas?` }),
      el('ul', { class: 'cases' }, caseRow(o.oldest))) : null,
  ];
}
