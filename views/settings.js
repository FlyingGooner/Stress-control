// Vy: Inställningar – grupper (hopfällbara) med sektioner, som simple-nutrition. Allmänt: Data, installera, Hjälp.
import { addDays, LIM, storageUsed, STORAGE_QUOTA, TRASH_DAYS, TITLE_CHARS, COLORS, COLOR_NAMES } from '../store.js';
import { today, S, setOpen, el, shortDate } from '../ui.js';
import { hasData, savedPassword } from './data.js';

// In-app manual: static <template id="help-tpl"> in index.html (built from docs/MANUAL.md), cloned – never parsed as HTML text.
function helpCard() {
  const frag = document.importNode((document.getElementById(self.I18N.lang() === 'en' ? 'help-tpl-en' : 'help-tpl') || document.getElementById('help-tpl')).content, true);
  const sec = frag.querySelector('.help');
  const wrap = el('details', { class: 'card set-sec help help-wrap', 'data-sec': 'help', open: setOpen.has('help') },
    el('summary', { class: 'help-title' }, el('span', { class: 'set-title', text: 'Hjälp och manual' }), el('span', { class: 'set-hint', text: 'Så funkar appen' })));
  if (sec) { sec.querySelector('h2')?.remove(); wrap.append(...sec.childNodes); }
  return wrap;
}

export function viewSettings() {
  const sec = (id, title, hint, ...kids) => el('details', { class: 'card set-sec', 'data-sec': id, open: setOpen.has(id) },
    el('summary', {}, el('span', { class: 'set-title', text: title }), hint ? el('span', { class: 'set-hint', text: hint }) : null),
    el('div', { class: 'set-body' }, kids));
  // A group is itself collapsible; its sections fold inside it. Add the app's own groups above Allmänt.
  const group = (id, title, hint, ...kids) => el('details', { class: 'set-group-wrap', 'data-sec': 'g-' + id, open: setOpen.has('g-' + id) },
    el('summary', { class: 'set-group' }, el('span', { class: 'set-gtitle', text: title }), el('span', { class: 'set-hint', text: hint })), kids);
  const last = S.state.backup.last, old = !last || addDays(last, 30) <= today();
  const used = storageUsed(), full = used >= STORAGE_QUOTA * 0.8;
  const mb = (n) => { const d = n < 1e5 ? 2 : 1; return (n / 1e6).toLocaleString('sv-SE', { minimumFractionDigits: d, maximumFractionDigits: d }); };
  let installed = false;
  try { installed = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; } catch { /* old browser */ }
  const { tpls, people } = S.state;
  return [
    el('h1', { class: 'view-title', text: 'Inställningar' }),
    group('cases', 'Ärenden', `Färger · ${tpls.length} mallar · ${people.length} personer`,
      // Mallar (2026-11-22): som rätterna i Fitness buddy – sparas från ett ärende, här bara byta namn och ta bort.
      sec('tpls', 'Mallar', tpls.length ? `${tpls.length} st` : 'Inga',
        el('p', { class: 'muted small', text: 'Spara ett ärende som mall med Spara som mall längst ner i ärendet. Under Nytt ärende kan du sedan starta från mallen, med beskrivning och delmål ifyllda.' }),
        tpls.length ? el('ul', { class: 'edit-list' }, tpls.map((t) => el('li', { class: 'name-row' },
          el('input', { type: 'text', maxlength: TITLE_CHARS, value: t.title, 'aria-label': 'Mallens namn', 'data-act': 'tname', 'data-id': t.id, autocomplete: 'off' }),
          el('small', { class: 'muted', text: t.s?.length ? `${t.s.length} delmål` : '' }),
          el('button', { class: 'icon sm danger', 'data-act': 'tdel', 'data-id': t.id, 'aria-label': `Ta bort ${t.title}`, text: '✕' })))) : null),
      sec('colors', 'Färger', Object.keys(S.state.labels).length ? COLORS.filter((k) => S.state.labels[k]).map((k) => S.state.labels[k]).join(', ') : 'Utan betydelse',
        el('p', { class: 'muted small', text: 'Ett ärende kan få en färg (överst i ärendet). Skriv vad färgerna betyder om du vill – det syns i listan och i filtret.' }),
        el('ul', { class: 'edit-list' }, COLORS.map((k) => el('li', { class: `name-row cat-row c-${k}` },
          el('span', { class: 'cat-dot', 'aria-hidden': 'true' }),
          el('input', { type: 'text', maxlength: 30, value: S.state.labels[k] || '', placeholder: COLOR_NAMES[k], 'aria-label': `Vad ${COLOR_NAMES[k].toLowerCase()} betyder`, 'data-act': 'clabel', 'data-id': k, autocomplete: 'off' }))))),
      sec('people', 'Personer', people.length ? people.map((x) => x.name).join(', ') : 'Inga',
        el('p', { class: 'muted small', text: 'De som kan utföra ett ärende. Finns det personer kan du välja vem i ärendet och filtrera listan.' }),
        people.length ? el('ul', { class: 'edit-list' }, people.map((x) => el('li', { class: 'name-row' },
          el('input', { type: 'text', maxlength: 30, value: x.name, 'aria-label': 'Namn', 'data-act': 'pname', 'data-id': x.id, autocomplete: 'off' }),
          el('button', { class: 'icon sm danger', 'data-act': 'pdel', 'data-id': x.id, 'aria-label': `Ta bort ${x.name}`, text: '✕' })))) : null,
        people.length < LIM.people ? el('div', { class: 'pick-row' },
          el('input', { type: 'text', id: 'p-new', maxlength: 30, placeholder: 'Namn', 'aria-label': 'Ny person', autocomplete: 'off' }),
          el('button', { class: 'weigh-save', 'data-act': 'pnew', text: 'Lägg till' })) : null),
      sec('trash', 'Papperskorg', `${S.state.trash.length} ärenden · ${trashLabel(S.state.trashDays).toLowerCase()}`,
        el('p', { class: 'muted small', text: 'Ärenden du tar bort hamnar här. Vill du spara ett ärende: markera det som klart i stället.' }),
        el('button', { class: 'link', 'data-act': 'trashopen', text: `Visa papperskorgen (${S.state.trash.length})` }),
        el('label', { class: 'goal-row' }, el('span', { text: 'Raderas automatiskt' }),
          el('select', { 'data-act': 'trashdays', 'aria-label': 'Raderas automatiskt' }, TRASH_DAYS.map((d) => el('option', { value: d, selected: d === S.state.trashDays, text: trashLabel(d) })))),
        el('button', { class: 'link danger', 'data-act': 'tempty', disabled: !S.state.trash.length, text: 'Töm papperskorgen' }))),
    group('app', 'Allmänt', 'Språk, data, hjälp',
      sec('lang', 'Språk', self.I18N.LANGS[self.I18N.lang()],
        el('label', { class: 'goal-row' }, el('span', { text: 'Språk' }),
          el('select', { 'data-act': 'lang', 'aria-label': 'Språk' },
            Object.entries(self.I18N.LANGS).map(([v, l]) => el('option', { value: v, selected: self.I18N.lang() === v, text: l, 'data-no-tr': '' }))))),
      sec('data', 'Data', 'Backup, import, radera',
        installed ? null : el('p', { class: 'small bk-warn', text: 'Appen är inte installerad. På iPhone kan Safari rensa datan för sidor du inte besökt på ett tag – lägg appen på hemskärmen (Dela → Lägg till på hemskärmen) och spara backup regelbundet.' }),
        full ? el('p', { class: 'bk-status bk-old' }, `Använder ${mb(used)} MB av cirka ${mb(STORAGE_QUOTA)} MB`,
          el('small', { text: 'Lagringen börjar bli full. Spara en backup-fil och ta bort gamla trådar.' })) : null,
        el('p', { class: 'bk-status' + (old && hasData() ? ' bk-old' : '') },
          last ? `Senaste backup: ${shortDate(last)}` : 'Ingen backup sparad än',
          old && hasData() ? el('small', { text: last ? 'Mer än en månad sedan – bra idé att göra en ny.' : 'Bra idé att göra en nu.' }) : null),
        el('div', { class: 'data-actions' },
          el('button', { class: 'btn-file btn-filled', 'data-act': 'backupsave', text: 'Spara backup-fil' }),
          el('label', { class: 'btn-file' }, 'Läs in backup-fil',
            el('input', { type: 'file', id: 'import-file', accept: '.txt,.json', 'data-act': 'importfile' }))),
        pwdBox(),
        el('p', { class: 'import-error small', id: 'import-error', role: 'alert' }),
        // Städat (2026-11-17): det man sällan behöver ligger under Fler val.
        el('details', { class: 'data-more', 'data-sec': 'data-more', open: setOpen.has('data-more') }, el('summary', { text: 'Fler val' }),
          el('details', { class: 'data-text' }, el('summary', { text: 'Klistra in text' }),
            el('label', { class: 'data-box' }, el('span', { class: 'small', text: 'Importera (ersätter all data)' }),
              el('textarea', { id: 'import-text', rows: 3, autocomplete: 'off', spellcheck: 'false', placeholder: 'Klistra in innehållet i en backup-fil' })),
            el('button', { class: 'link', 'data-act': 'import', text: 'Importera' })),
          el('label', { class: 'goal-row' }, el('span', { text: 'Påminn om backup' }),
            el('select', { 'data-act': 'bkremind', 'aria-label': 'Påminn om backup' },
              [['week', 'Varje vecka'], ['month', 'Varje månad'], ['off', 'Aldrig']].map(([v, l]) =>
                el('option', { value: v, selected: S.state.backup.remind === v, text: l })))),
          el('div', { class: 'csv-row' }, el('button', { class: 'link', 'data-act': 'csv', text: 'Exportera CSV' }),
            el('p', { class: 'muted small', text: 'Ett okrypterat kalkylark, t.ex. för Excel.' })),
          el('button', { class: 'link pwd-own', 'data-act': 'pwdown', text: 'Välj egen kod' }),
          full ? null : el('p', { class: 'muted small', text: `Använder ${mb(used)} MB av cirka ${mb(STORAGE_QUOTA)} MB` }),
          el('p', { class: 'muted small', text: 'All data finns bara i den här webbläsaren. Läs in backup-filen på en annan enhet för att flytta den.' }),
          el('button', { class: 'link danger', 'data-act': 'wipe', text: 'Radera all data' }))),
      S.installPrompt ? el('section', { class: 'card' }, el('button', { class: 'primary', 'data-act': 'install', text: 'Installera appen' })) : null,
      // Alla appar (2026-11-15): öppna i webbläsaren eller ladda ner från GitHub. el() släpper inte igenom href, så de fasta adresserna sätts med Object.assign (aldrig data).
      sec('apps', 'Alla mina appar', 'Öppna, ladda ner, GitHub', el('div', { class: 'dl-src' },
        el('div', { class: 'dl-app' }, el('b', { text: 'Fitness buddy' + ('') }),
          Object.assign(el('a', { class: 'link', target: '_blank', rel: 'noopener', text: 'Öppna' }), { href: 'https://flyinggooner.github.io/simple-nutrition/' }),
          Object.assign(el('a', { class: 'link', download: 'simple-nutrition.html', text: 'Ladda ner (HTML)' }), { href: 'https://flyinggooner.github.io/simple-nutrition/simple-nutrition.html' }),
          Object.assign(el('a', { class: 'link', rel: 'noopener', target: '_blank', text: 'GitHub' }), { href: 'https://github.com/FlyingGooner/simple-nutrition' }))),
        el('div', { class: 'dl-app' }, el('b', { text: 'Budget buddy' + ('') }),
          Object.assign(el('a', { class: 'link', target: '_blank', rel: 'noopener', text: 'Öppna' }), { href: 'https://flyinggooner.github.io/budget-buddy/' }),
          Object.assign(el('a', { class: 'link', download: 'budget-buddy.html', text: 'Ladda ner (HTML)' }), { href: 'https://flyinggooner.github.io/budget-buddy/budget-buddy.html' }),
          Object.assign(el('a', { class: 'link', rel: 'noopener', target: '_blank', text: 'GitHub' }), { href: 'https://github.com/FlyingGooner/budget-buddy' })),
        el('div', { class: 'dl-app' }, el('b', { text: 'Football, not soccer' + ('') }),
          Object.assign(el('a', { class: 'link', target: '_blank', rel: 'noopener', text: 'Öppna' }), { href: 'https://flyinggooner.github.io/Football-not-soccer/' }),
          Object.assign(el('a', { class: 'link', download: 'Football-not-soccer.html', text: 'Ladda ner (HTML)' }), { href: 'https://flyinggooner.github.io/Football-not-soccer/Football-not-soccer.html' }),
          Object.assign(el('a', { class: 'link', rel: 'noopener', target: '_blank', text: 'GitHub' }), { href: 'https://github.com/FlyingGooner/Football-not-soccer' })),
        el('div', { class: 'dl-app' }, el('b', { text: 'Task buddy' + (" (den här)") }),
          Object.assign(el('a', { class: 'link', target: '_blank', rel: 'noopener', text: 'Öppna' }), { href: 'https://flyinggooner.github.io/Stress-control/' }),
          Object.assign(el('a', { class: 'link', download: 'Stress-control.html', text: 'Ladda ner (HTML)' }), { href: 'Stress-control.html' }),
          Object.assign(el('a', { class: 'link', rel: 'noopener', target: '_blank', text: 'GitHub' }), { href: 'https://github.com/FlyingGooner/Stress-control' })),
        el('p', { class: 'small', text: 'Spara som app: Android (Chrome) – tryck ⋮ och välj Installera app. iPhone (Safari) – tryck Dela och välj Lägg till på hemskärmen.' }),
        el('p', { class: 'muted small', text: 'Ladda ner (HTML) ger hela appen i en enda fil som du öppnar i webbläsaren, även utan nät. Den sparar sin data för sig – flytta data dit med en backup-fil.' })),
      helpCard()),
    el('p', { class: 'muted small center', text: `Task buddy v${self.APP_VERSION} · inga externa anrop` }),
  ];
}

export const trashLabel = (d) => (d ? `Efter ${d === 365 ? '1 år' : d + ' dagar'}` : 'Aldrig');

// Din kod (2026-11-15): skapas alltid av appen. Visa, Kopiera, Ny kod.
function pwdBox() {
  const p = savedPassword();
  return el('div', { class: 'pwd-card' },
    el('div', { class: 'pwd-head' }, el('span', { text: '🔑 Din kod' }),
      el('button', { class: 'link', 'data-act': 'pwdshow', 'aria-pressed': S.showPwd ? 'true' : 'false', text: S.showPwd ? 'Dölj' : 'Visa' }),
      el('button', { class: 'link', 'data-act': 'pwdcopy', text: 'Kopiera' }),
      el('button', { class: 'link', 'data-act': 'pwdset', text: 'Ny kod' })),
    S.showPwd && p ? el('p', { class: 'pwd-show', text: p }) : null,
    el('p', { class: 'muted small pwd-note', text: 'Backupen låses med koden. Spara den i din lösenordshanterare.' }));
}
