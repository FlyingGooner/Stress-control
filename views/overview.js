// Vy: Överblick – Aktuellt (inom påminnelsetiden + passerade deadlines), siffror, per kategori, Kommande (vecka/månad).
import { overview, alerts, typeOf } from '../store.js';
import { today, S, el, longDate } from '../ui.js';
import { caseEditor } from './cases.js';
import { typeEditor } from './settings.js';

export function viewOverview() {
  if (S.tedit) return typeEditor();
  if (S.open) return caseEditor();
  const o = overview(S.state, today()), max = Math.max(1, ...o.per.map((x) => x.n));
  const stat = (n, label) => el('div', { class: 'stat' }, el('span', { class: 'stat-n', text: String(n) }), el('span', { text: label }));
  const al = alerts(S.state, today()), n = S.state.alertDays ?? 7;
  const when = (a) => a.late ? (a.days === -1 ? 'igår' : `${-a.days} dagar sen`) : a.days === 0 ? 'idag' : a.days === 1 ? 'imorgon' : `om ${a.days} dagar`;
  const row = (a) => el('li', {},
    el('button', { class: 'alert-row' + (a.late ? ' late' : ''), 'data-act': 'copen', 'data-id': a.c.id },
      el('span', { class: 'case-icon', 'aria-hidden': 'true', text: typeOf(S.state, a.c)?.icon || '📌' }),
      el('span', { class: 'case-main' }, el('span', { class: 'case-title', text: a.c.title }),
        el('small', { text: `${a.name}: ${longDate(a.v.slice(0, 10))}${a.kind === 'dt' ? ' ' + a.v.slice(11) : ''}` })),
      el('span', { class: 'alert-when', text: when(a) })));
  // Kommande: dates after the reminder time, up to a month ahead – grouped by week and month.
  const later = alerts(S.state, today(), 30).filter((a) => !a.late && a.days > n);
  const week = later.filter((a) => a.days <= 14), month = later.filter((a) => a.days > 14);
  return [
    el('h1', { class: 'view-title', text: 'Överblick' }),
    el('section', { class: 'card alerts' + (al.length ? ' has' : '') },
      el('h2', {}, el('span', { text: 'Aktuellt' }), al.length ? el('span', { class: 'badge', text: String(al.length) }) : null),
      al.length ? el('ul', { class: 'alert-list' }, al.map(row))
        : el('p', { class: 'muted small', text: `Inget som närmar sig de närmaste ${n} dagarna.` })),
    el('section', { class: 'card stats3' }, stat(o.open, 'öppna ärenden'), stat(o.steps, 'delmål kvar'), stat(o.closed30, 'stängda, 30 dagar')),
    el('section', { class: 'card' }, el('h2', { text: 'Per kategori' }),
      el('ul', { class: 'bars' }, o.per.map(({ cat, n }) => el('li', { class: `c-${cat.color}` },
        el('span', { class: 'bar-name', text: cat.name }),
        el('progress', { max, value: n, 'aria-label': `${cat.name}: ${n} öppna` }),
        el('span', { class: 'bar-n', text: String(n) }))))),
    later.length ? el('section', { class: 'card upcoming' }, el('h2', { text: 'Kommande' }),
      week.length ? [el('h3', { class: 'up-h', text: n < 7 ? 'Inom två veckor' : 'Nästa vecka' }), el('ul', { class: 'alert-list' }, week.map(row))] : null,
      month.length ? [el('h3', { class: 'up-h', text: 'Inom en månad' }), el('ul', { class: 'alert-list' }, month.map(row))] : null) : null,
  ];
}
