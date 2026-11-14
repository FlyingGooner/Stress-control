// Vy: Överblick – Aktuellt (inom påminnelsetiden + passerade deadlines), siffror, per kategori, Kommande (vecka/månad).
import { overview, alerts, daysBetween, typeOf } from '../store.js';
import { today, S, el, longDate } from '../ui.js';
import { caseView } from './cases.js';
import { typeEditor } from './settings.js';

export function viewOverview() {
  if (S.tedit) return typeEditor();
  if (S.open) return caseView();
  if (S.steps) return stepsView();
  const o = overview(S.state, today()), max = Math.max(1, ...o.per.map((x) => x.n));
  const stat = (n, label, act, aria) => el('button', { class: 'stat stat-btn', 'data-act': act, 'aria-label': aria }, el('span', { class: 'stat-n', text: String(n) }), el('span', { text: label + ' ›' }));
  const al = alerts(S.state, today()), n = S.state.alertDays ?? 7;
  const acute = al.filter((a) => a.late || a.days <= 1), soon = al.filter((a) => !(a.late || a.days <= 1));   // Akut: passed, today, tomorrow
  const when = (a) => a.late ? (a.days === -1 ? 'igår' : `${-a.days} dagar sen`) : a.days === 0 ? 'idag' : a.days === 1 ? 'imorgon' : `om ${a.days} dagar`;
  const row = (a) => el('li', {},
    el('button', { class: 'alert-row' + (a.late || a.days <= 1 ? ' late' : ''), 'data-act': 'copen', 'data-id': a.c.id },
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
      al.length ? [
        acute.length ? [el('h3', { class: 'up-h acute-h', text: 'Akut – försenat, idag eller imorgon' }), el('ul', { class: 'alert-list' }, acute.map(row))] : null,
        soon.length ? [acute.length ? el('h3', { class: 'up-h', text: `Snart – inom ${n} dagar` }) : null, el('ul', { class: 'alert-list' }, soon.map(row))] : null]
        : el('p', { class: 'muted small', text: `Inget som närmar sig de närmaste ${n} dagarna.` })),
    el('section', { class: 'card stats3' }, stat(o.open, 'öppna trådar', 'gocases', `${o.open} öppna trådar – visa`), stat(o.steps, 'delmål kvar', 'stepsopen', `${o.steps} delmål kvar – visa alla`), stat(o.closed30, 'stängda, 30 dagar', 'goarch', `${o.closed30} stängda senaste 30 dagarna – visa Arkiv`)),
    el('section', { class: 'card' }, el('h2', { text: 'Per kategori' }),
      el('ul', { class: 'bars' }, o.per.map(({ cat, n }) => el('li', { class: `c-${cat.color}` }, el('button', { class: 'bar-btn', 'data-act': 'gocases', 'data-id': cat.id, disabled: !n, 'aria-label': `${cat.name}: ${n} öppna – visa` },
        el('span', { class: 'bar-name', text: cat.name }),
        el('progress', { max, value: n, 'aria-hidden': 'true' }),
        el('span', { class: 'bar-n', text: String(n) })))))),
    later.length ? el('section', { class: 'card upcoming' }, el('h2', { text: 'Kommande' }),
      week.length ? [el('h3', { class: 'up-h', text: n < 7 ? 'Inom två veckor' : 'Nästa vecka' }), el('ul', { class: 'alert-list' }, week.map(row))] : null,
      month.length ? [el('h3', { class: 'up-h', text: 'Inom en månad' }), el('ul', { class: 'alert-list' }, month.map(row))] : null) : null,
  ];
}

// Delmål kvar: every open sub-goal with its case, dated first (by date), then the rest by case. Tick off right here.
function stepsView() {
  const t0 = today(), rows = [];
  for (const c of S.state.cases) if (!c.x) (c.s || []).forEach(([x, done, d], i) => { if (!done) rows.push({ c, x, d, i }); });
  rows.sort((a, b) => (a.d && b.d ? (a.d < b.d ? -1 : a.d > b.d ? 1 : 0) : a.d ? -1 : b.d ? 1 : a.c.title.localeCompare(b.c.title, 'sv')));
  const when = (d) => { const n = daysBetween(t0, d); return n < 0 ? (n === -1 ? 'igår' : `${-n} dagar sen`) : n === 0 ? 'idag' : n === 1 ? 'imorgon' : `om ${n} dagar`; };
  return el('section', { class: 'card' },
    el('div', { class: 'add-top' },
      el('button', { class: 'icon', 'data-act': 'stepsclose', 'aria-label': 'Stäng', text: '✕' }),
      el('h1', { class: 'add-title', text: `Delmål kvar (${rows.length})` })),
    rows.length ? el('ul', { class: 'steps all-steps' }, rows.map(({ c, x, d, i }) => {
      const ty = typeOf(S.state, c), late = d && d < t0;
      return el('li', { class: late ? 'late' : '' },
        el('input', { type: 'checkbox', 'data-act': 'stog', 'data-case': c.id, 'data-i': i, 'aria-label': `${x} klart` }),
        el('button', { class: 'step-open', 'data-act': 'copen', 'data-id': c.id },
          el('span', { class: 'step-x', text: x }),
          el('small', { text: `${ty?.icon || '📌'} ${c.title}` })),
        d ? el('span', { class: 'step-when', text: when(d) }) : null);
    })) : el('p', { class: 'muted', text: 'Inga delmål kvar. Bra jobbat!' }),
    el('p', { class: 'muted small', text: 'Bocka av direkt här, eller tryck på ett delmål för att öppna tråden.' }));
}
