// Vy: Kalender (2026-11-27) – månad med deadlines. En prick per ärende i ärendets färg. Under kalendern månadens ärenden (2026-11-28);
// tryck på en dag = bara den dagen, tryck igen = hela månaden. Svep åt sidan på kalendern byter månad (app.js).
// Ett ärende öppnas i samma lager som från Ärenden. Klara ärenden (arkivet) visas som en tunn ring när arkivet är inläst.
import { openCases, closedCases, archReady, dueDay, parseKey, monthDays } from '../store.js';
import { today, S, el, shortDate, longDate } from '../ui.js';
import { caseRow, caseView, personFilter, catFilter } from './cases.js';

const WD = () => (self.I18N?.lang() === 'en' ? ['M', 'T', 'W', 'T', 'F', 'S', 'S'] : ['M', 'T', 'O', 'T', 'F', 'L', 'S']);
const monthName = (m) => { const s = parseKey(m + '-01').toLocaleDateString('sv-SE', { month: 'long', year: 'numeric' }); return s[0].toUpperCase() + s.slice(1); };

export function viewCalendar() {
  if (S.open) return caseView();
  const t = today();
  S.cmonth ??= t.slice(0, 7);
  const m = S.cmonth, { lead, days } = monthDays(m);
  // Filter (2026-11-28): samma person- och färgfilter som Ärenden, egna val i Kalender.
  const all = [...openCases(S.state), ...(archReady() ? closedCases(S.state) : [])].filter((c) => c.due);
  const [psel, mine] = personFilter(all, 'cpfilter'), [ksel, shown] = catFilter(mine, 'ckfilter');
  const open = shown.filter((c) => !c.x), done = shown.filter((c) => c.x);
  const byDay = (k) => [...open.filter((c) => dueDay(c) === k), ...done.filter((c) => dueDay(c) === k)];
  const sel = S.cday && S.cday.startsWith(m) ? S.cday : null;
  // Listan under kalendern (2026-11-28): denna månad = försenade och kommande öppna ärenden oavsett månad;
  // en senare månad = öppna från den månadens början; en tidigare månad = den månadens ärenden (även klara).
  const byDue = (a, b) => (a.due < b.due ? -1 : a.due > b.due ? 1 : 0), cm = t.slice(0, 7);
  const inMonth = (m < cm ? [...open, ...done].filter((c) => dueDay(c).startsWith(m))
    : open.filter((c) => m === cm || dueDay(c) >= m + '-01')).sort(byDue);
  const listHead = m < cm ? `Deadline i ${monthName(m).split(' ')[0].toLowerCase()} (${inMonth.length})`
    : m === cm ? `Försenade och kommande (${inMonth.length})` : `Kommande från ${monthName(m).split(' ')[0].toLowerCase()} (${inMonth.length})`;
  const cells = [...Array(lead).fill(null), ...days];
  const late = open.filter((c) => dueDay(c) < t).length;
  return [
    el('h1', { class: 'view-title', text: 'Kalender' }),
    // Månadsraden (2026-11-28): ◀ månad ▶ till vänster, filter och Idag till höger på samma rad (bryts vid behov).
    el('div', { class: 'cal-nav' },
      el('div', { class: 'cal-step' },
        el('button', { class: 'icon sm', 'data-act': 'cmonth', 'data-id': '-1', 'aria-label': 'Föregående månad', text: '◀' }),
        // I en annan månad: ↺ efter namnet visar att ett tryck går tillbaka till idag (ersätter Idag-knappen, får plats på raden).
        el('button', { class: 'cal-month link', 'data-act': 'cmonth', 'data-id': '0', 'aria-label': 'Till idag', title: 'Till idag' }, el('span', { class: 'cal-mname', text: m.slice(0, 4) === t.slice(0, 4) ? monthName(m).split(' ')[0] : monthName(m) })   /* året bara när det inte är i år (får plats på smal skärm) */, m !== t.slice(0, 7) ? el('span', { class: 'cal-back', 'aria-hidden': 'true', text: '↺' }) : null),
        el('button', { class: 'icon sm', 'data-act': 'cmonth', 'data-id': '1', 'aria-label': 'Nästa månad', text: '▶' })),
      psel || ksel ? el('div', { class: 'cal-tools' }, psel, ksel) : null),
    late ? el('p', { class: 'muted small due-sum', text: `${late} försenade` }) : null,
    el('div', { class: 'cal-grid', 'aria-label': monthName(m) },
      WD().map((d) => el('span', { class: 'cal-wd', 'aria-hidden': 'true', text: d })),
      cells.map((k) => {
        if (!k) return el('span', { class: 'cal-cell empty' });
        const list = byDay(k), nOpen = list.filter((c) => !c.x).length;
        const cls = 'cal-cell' + (k === t ? ' today' : '') + (k === sel ? ' sel' : '') + (nOpen && k < t ? ' late' : '');
        return el('button', { class: cls, 'data-act': 'cday', 'data-id': k, 'aria-pressed': String(k === sel), 'aria-label': `${longDate(k)}${list.length ? `, ${list.length} ${list.length === 1 ? 'ärende' : 'ärenden'}` : ''}` },
          el('span', { class: 'cal-n', text: String(Number(k.slice(8))) }),
          list.length ? el('span', { class: 'cal-dots', 'aria-hidden': 'true' },
            list.slice(0, 4).map((c) => el('span', { class: 'cal-dot' + (c.k ? ` c-${c.k}` : '') + (c.x ? ' done' : '') })),
            list.length > 4 ? el('span', { class: 'cal-more', text: '+' }) : null) : null);
      })),
    sel ? [el('div', { class: 'cal-head' }, el('h2', { class: 'sub-h', text: sel === t ? `Idag ${shortDate(sel)}` : longDate(sel) }),
        el('button', { class: 'link', 'data-act': 'cday', 'data-id': '', text: 'Hela månaden' })),
      ((list) => list.length ? el('ul', { class: 'cases' }, list.map(caseRow)) : el('p', { class: 'muted small', text: 'Inga ärenden med deadline den dagen.' }))(byDay(sel))]
      : [el('h2', { class: 'sub-h', text: listHead }),
        inMonth.length ? el('ul', { class: 'cases' }, inMonth.map(caseRow)) : el('p', { class: 'muted small', text: m < cm ? 'Inga ärenden med deadline den här månaden.' : 'Inga kommande ärenden med deadline.' })],
    // Nytt ärende från Kalender (2026-11-28): med vald dag som deadline.
    el('button', { class: 'primary new-case', 'data-act': 'pickopen', 'data-id': sel || '', text: sel ? `+ Nytt ärende ${shortDate(sel)}` : '+ Nytt ärende' }),
    !open.length && !done.length ? el('p', { class: 'muted small center', text: 'Ge ett ärende en deadline så syns det här.' }) : null,
  ];
}
