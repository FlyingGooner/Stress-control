// Vy: Inställningar – grupper (hopfällbara) med sektioner, som simple-nutrition. Allmänt: Data, installera, Hjälp.
import { addDays, WEEK_HOURS, PERSON_KINDS, REL_CHILD, COLORS, COLOR_NAMES, KINDS, LIM, storageUsed, STORAGE_QUOTA, ALERT_DAYS, TRASH_DAYS } from '../store.js';
import { today, S, setOpen, el, shortDate } from '../ui.js';
import { hasData, savedPassword, rememberOn } from './data.js';

// In-app manual: static <template id="help-tpl"> in index.html (built from docs/MANUAL.md), cloned – never parsed as HTML text.
function helpCard() {
  const frag = document.importNode((document.getElementById(self.I18N.lang() === 'en' ? 'help-tpl-en' : 'help-tpl') || document.getElementById('help-tpl')).content, true);
  const sec = frag.querySelector('.help');
  const wrap = el('details', { class: 'card set-sec help help-wrap', 'data-sec': 'help', open: setOpen.has('help') },
    el('summary', { class: 'help-title' }, el('span', { class: 'set-title', text: 'Hjälp och manual' }), el('span', { class: 'set-hint', text: 'Så funkar appen' })));
  if (sec) { sec.querySelector('h2')?.remove(); wrap.append(...sec.childNodes); }
  return wrap;
}

// Typredigeraren (lager, Bakåt stänger; osparat → "Släng ändringarna?"): namn, ikon, kategori, fält i ordning, förslag på delmål.
export function typeEditor() {
  const d = S.tedit, used = [...S.state.cases, ...S.state.trash].some((c) => c.t === d.id);
  return el('section', { class: 'card' },
    el('div', { class: 'add-top' },
      el('button', { class: 'icon', 'data-act': 'tclose', 'aria-label': 'Stäng', text: '✕' }),
      el('h1', { class: 'add-title', text: d.isNew ? 'Ny typ' : 'Ändra typ' })),
    el('div', { class: 'pick-row' },
      el('input', { type: 'text', id: 't-icon', class: 'icon-in', maxlength: 8, value: d.icon, 'aria-label': 'Ikon (emoji)', 'data-act': 'tset', 'data-id': 'icon', autocomplete: 'off' }),
      el('input', { type: 'text', id: 't-name', maxlength: 30, value: d.name, placeholder: 'Namn, t.ex. Hus', 'aria-label': 'Namn', 'data-act': 'tset', 'data-id': 'name', autocomplete: 'off' })),
    el('label', { class: 'goal-row' }, el('span', { text: 'Kategori' }),
      el('select', { 'data-act': 'tset', 'data-id': 'cat', 'aria-label': 'Kategori' }, S.state.cats.map((c) => el('option', { value: c.id, selected: c.id === d.cat, text: c.name })))),
    el('h2', { class: 'sub-h', text: 'Fält' }),
    el('ul', { class: 'edit-list' }, d.fields.map((f, i) => el('li', { class: 'field-edit' },
      el('input', { type: 'text', maxlength: 40, value: f.name, 'aria-label': 'Fältets namn', 'data-act': 'fname', 'data-i': i, autocomplete: 'off' }),
      el('select', { 'data-act': 'fkind', 'data-i': i, 'aria-label': 'Sort' }, Object.entries(KINDS).map(([k, l]) => el('option', { value: k, selected: k === f.kind, text: l }))),
      el('button', { class: 'icon sm', 'data-act': 'fup', 'data-i': i, 'aria-label': 'Flytta upp', disabled: i === 0, text: '↑' }),
      el('button', { class: 'icon sm danger', 'data-act': 'fdel', 'data-i': i, 'aria-label': 'Ta bort fältet', text: '✕' }),
      f.kind === 'choice' ? el('textarea', { class: 'opts-edit', rows: 3, 'aria-label': `Val för ${f.name || 'fältet'}, ett per rad`, placeholder: 'Val, ett per rad', 'data-act': 'fopts', 'data-i': i, text: (f.opts || []).join('\n') }) : null,
      f.kind === 'date' || f.kind === 'dt' ? el('label', { class: 'due-check' }, el('input', { type: 'checkbox', checked: !!f.due, 'data-act': 'fdue', 'data-i': i }), el('span', { text: 'Deadline – påminn även när datumet passerat' })) : null))),
    d.fields.length < LIM.fields ? el('button', { class: 'link', 'data-act': 'fadd', text: '+ Lägg till fält' }) : null,
    el('p', { class: 'muted small', text: 'Sorter: text, lång text, datum, datum och tid, tal, bock (t.ex. Pratat med banken ✓), val i lista (ett val per rad – i tråden går det också att lägga till egna) och dagar (VAB m.m.). Tar du bort ett fält flyttas ifyllda värden till Extra fält i trådarna, så inget försvinner.' }),
    el('h2', { class: 'sub-h', text: 'Förslag på delmål' }),
    el('textarea', { id: 't-steps', rows: 3, 'aria-label': 'Förslag på delmål, ett per rad', placeholder: 'Ett per rad, t.ex. Prata med banken', 'data-act': 'tsteps', text: d.steps.join('\n') }),
    el('p', { class: 'muted small', text: 'Läggs in som delmål när ett ny tråd av typen skapas.' }),
    el('p', { class: 'import-error small', id: 't-error', role: 'alert' }),
    el('div', { class: 'row-actions' },
      d.isNew ? el('span') : el('button', { class: 'link danger', 'data-act': 'tdel', disabled: used, title: used ? 'Används av trådar' : null, text: used ? 'Används – kan stängas av' : 'Ta bort typen' }),
      el('button', { class: 'weigh-save', 'data-act': 'tsave', text: 'Spara' })));
}

export function viewSettings() {
  if (S.tedit) return typeEditor();
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
  return [
    el('h1', { class: 'view-title', text: 'Inställningar' }),
    group('cases', 'Trådar', `${S.state.types.filter((t) => t.on).length} typer · ${S.state.cats.length} kategorier` + (S.state.people.length ? ` · ${S.state.people.length} personer` : ''),
      sec('types', 'Typer', `${S.state.types.filter((t) => t.on).length} av ${S.state.types.length} på`,
        el('p', { class: 'muted small', text: 'Bocka i de typer du vill kunna välja. Tryck på en typ för att ändra namn, kategori och fält.' }),
        el('ul', { class: 'edit-list' }, S.state.types.map((t) => el('li', { class: 'type-row' },
          el('input', { type: 'checkbox', checked: !!t.on, 'data-act': 'ton', 'data-id': t.id, 'aria-label': `Visa ${t.name}` }),
          el('button', { class: 'food-row', 'data-act': 'topen', 'data-id': t.id },
            el('span', { class: 'post-name' }, `${t.icon} ${t.name}`, el('small', { text: `${S.state.cats.find((c) => c.id === t.cat)?.name ?? ''} · ${t.fields.length} fält` + (t.steps?.length ? ` · ${t.steps.length} delmål` : '') })))))),
        S.state.types.length < LIM.types ? el('button', { class: 'link', 'data-act': 'tnew', text: '+ Egen typ' }) : null),
      sec('cats', 'Kategorier', S.state.cats.map((c) => c.name).join(', '),
        el('ul', { class: 'edit-list' }, S.state.cats.map((c) => el('li', { class: `cat-row c-${c.color}` },
          el('span', { class: 'cat-dot', 'aria-hidden': 'true' }),
          el('input', { type: 'text', maxlength: 30, value: c.name, 'aria-label': 'Kategorins namn', 'data-act': 'kname', 'data-id': c.id, autocomplete: 'off' }),
          el('select', { 'data-act': 'kcolor', 'data-id': c.id, 'aria-label': 'Färg' }, COLORS.map((k) => el('option', { value: k, selected: k === c.color, text: COLOR_NAMES[k] }))),
          el('button', { class: 'icon sm danger', 'data-act': 'kdel', 'data-id': c.id, 'aria-label': `Ta bort ${c.name}`, disabled: S.state.types.some((t) => t.cat === c.id) || S.state.cats.length <= 1, text: '✕' })))),
        el('p', { class: 'muted small', text: 'En kategori som används av en typ kan inte tas bort.' }),
        S.state.cats.length < LIM.cats ? el('button', { class: 'link', 'data-act': 'knew', text: '+ Ny kategori' }) : null),
      sec('people', 'Personer', S.state.people.length ? S.state.people.map((x) => x.name).join(', ') : 'Inga',
        el('p', { class: 'muted small', text: 'De som kan utföra en tråd. Tryck på en person för att se och ändra dess egenskaper. Vilka egenskaper som finns väljer du under Egenskaper längst ner – de gäller alla personer.' }),
        el('ul', { class: 'person-list' }, S.state.people.map(personCard)),
        S.state.people.length < LIM.people ? el('button', { class: 'link', 'data-act': 'pnew', text: '+ Ny person' }) : null,
        propsEditor())),
    sec('alerts', 'Påminnelser', `${S.state.alertDays ?? 7} dagar innan`,
      el('label', { class: 'goal-row' }, el('span', { text: 'Visa i Aktuellt' }),
        el('select', { 'data-act': 'alertdays', 'aria-label': 'Dagar innan' }, ALERT_DAYS.map((d) => el('option', { value: d, selected: d === (S.state.alertDays ?? 7), text: d === 1 ? '1 dag innan' : `${d} dagar innan` })))),
      el('p', { class: 'muted small', text: 'Datum i öppna trådar som närmar sig syns under Aktuellt i Överblick, med en röd siffra på fliken. Fält som är deadline (t.ex. Klart senast) syns även när datumet passerat. Välj deadline per fält under Typer.' })),
    sec('trash', 'Papperskorg', `${S.state.trash.length} trådar · ${trashLabel(S.state.trashDays).toLowerCase()}`,
      el('p', { class: 'muted small', text: 'Trådar du tar bort hamnar här. Vill du spara en tråd: arkivera den i stället.' }),
      el('button', { class: 'link', 'data-act': 'trashopen', text: `Visa papperskorgen (${S.state.trash.length})` }),
      el('label', { class: 'goal-row' }, el('span', { text: 'Raderas automatiskt' }),
        el('select', { 'data-act': 'trashdays', 'aria-label': 'Raderas automatiskt' }, TRASH_DAYS.map((d) => el('option', { value: d, selected: d === S.state.trashDays, text: trashLabel(d) })))),
      el('button', { class: 'link danger', 'data-act': 'tempty', disabled: !S.state.trash.length, text: 'Töm papperskorgen' }),
      el('h2', { class: 'sub-h', text: 'Rensa arkivet' }),
      el('p', { class: 'muted small', text: 'Flytta gamla arkiverade trådar till papperskorgen. Arkivet sparas komprimerat, så det behövs sällan.' }),
      el('div', { class: 'pick-row' },
        el('select', { id: 'aclean-age', 'aria-label': 'Stängda för mer än' }, [1, 2, 5, 10].map((y) => el('option', { value: y, selected: y === 2, text: `Stängda för mer än ${y} år sedan` }))),
        el('button', { class: 'weigh-save', 'data-act': 'aclean', text: 'Flytta' }))),
    group('app', 'Allmänt', 'Språk, data, hjälp',
      sec('lang', 'Språk', self.I18N.LANGS[self.I18N.lang()],
        el('label', { class: 'goal-row' }, el('span', { text: 'Språk' }),
          el('select', { 'data-act': 'lang', 'aria-label': 'Språk' },
            Object.entries(self.I18N.LANGS).map(([v, l]) => el('option', { value: v, selected: self.I18N.lang() === v, text: l, 'data-no-tr': '' }))))),
      sec('data', 'Data', 'Backup, import, radera',
        el('p', { class: 'small', text: 'All data sparas bara i den här webbläsaren (localStorage). Rensar du webbplatsdata eller avinstallerar appen försvinner den – spara en backup-fil då och då.' }),
        installed ? null : el('p', { class: 'small bk-warn', text: 'Appen är inte installerad. På iPhone kan Safari rensa datan för sidor du inte besökt på ett tag – lägg appen på hemskärmen (Dela → Lägg till på hemskärmen) och spara backup regelbundet.' }),
        el('p', { class: 'bk-status' + (full ? ' bk-old' : '') }, `Använder ${mb(used)} MB av cirka ${mb(STORAGE_QUOTA)} MB`,
          full ? el('small', { text: 'Lagringen börjar bli full. Spara en backup-fil och ta bort gamla trådar.' }) : null),
        el('p', { class: 'muted small', text: 'Backup-filen innehåller all din data och krypteras alltid med ett lösenord du väljer. Du kan också låta appen skapa ett slumpmässigt lösenord. Glömmer du det går filen inte att öppna. Läs in filen på en annan enhet för att flytta din data.' }),
        el('p', { class: 'bk-status' + (old && hasData() ? ' bk-old' : '') },
          last ? `Senaste backup: ${shortDate(last)}` : 'Ingen backup sparad än',
          old && hasData() ? el('small', { text: last ? 'Mer än en månad sedan – bra idé att göra en ny.' : 'Bra idé att göra en nu.' }) : null),
        el('div', { class: 'data-actions' },
          el('button', { class: 'btn-file btn-filled', 'data-act': 'backupsave', text: 'Spara backup-fil' }),
          el('label', { class: 'btn-file' }, 'Läs in backup-fil',
            el('input', { type: 'file', id: 'import-file', accept: '.txt,.json', 'data-act': 'importfile' }))),
        pwdBox(),
        el('p', { class: 'import-error small', id: 'import-error', role: 'alert' }),
        el('details', { class: 'data-text' }, el('summary', { text: 'Klistra in text' }),
          el('label', { class: 'data-box' }, el('span', { class: 'small', text: 'Importera (ersätter all data)' }),
            el('textarea', { id: 'import-text', rows: 3, autocomplete: 'off', spellcheck: 'false', placeholder: 'Klistra in innehållet i en backup-fil' })),
          el('button', { class: 'link', 'data-act': 'import', text: 'Importera' })),
        el('label', { class: 'goal-row' }, el('span', { text: 'Påminn om backup' }),
          el('select', { 'data-act': 'bkremind', 'aria-label': 'Påminn om backup' },
            [['week', 'Varje vecka'], ['month', 'Varje månad'], ['off', 'Aldrig']].map(([v, l]) =>
              el('option', { value: v, selected: S.state.backup.remind === v, text: l })))),
        el('button', { class: 'link danger', 'data-act': 'wipe', text: 'Radera all data' })),
      S.installPrompt ? el('section', { class: 'card' }, el('button', { class: 'primary', 'data-act': 'install', text: 'Installera appen' })) : null,
      helpCard()),
    el('p', { class: 'muted small center', text: `Stress kontroll v${self.APP_VERSION} · inga externa anrop` }),
  ];
}

// Personer. A person card: avatar (initial), name and a short summary; open = name, working hours and every egenskap.
const AV_COLORS = ['purple', 'teal', 'orange', 'blue', 'pink', 'green'];
export const isChild = (x) => x.v?.rel === REL_CHILD;
function ageOf(x) {
  const b = x.v?.born; if (!b) return null;
  const n = Math.floor((Number(today().replace(/-/g, '')) - Number(b.replace(/-/g, ''))) / 10000);
  return n >= 0 ? n : null;
}
export function personHint(x) {
  const age = ageOf(x), first = S.state.pfields.find((f) => f.kind === 'choice' && x.v?.[f.id]);
  return [first ? x.v[first.id] : null, age != null ? `${age} år` : null, isChild(x) ? null : `${String(x.h ?? WEEK_HOURS).replace('.', ',')} tim/v`].filter(Boolean).join(' · ');
}
function propInput(x, f) {
  const v = x.v?.[f.id], common = { 'data-act': 'pval', 'data-id': x.id, 'data-key': f.id, 'aria-label': f.name, autocomplete: 'off' };
  switch (f.kind) {
    case 'check': return el('input', { ...common, type: 'checkbox', checked: v === 1 });
    case 'note': return el('textarea', { ...common, rows: 2, maxlength: 2000, text: v ?? '' });
    case 'date': return el('input', { ...common, type: 'date', value: v ?? '' });
    case 'num': return el('input', { ...common, type: 'text', inputmode: 'decimal', value: v != null ? String(v).replace('.', ',') : '' });
    case 'choice': { const opts = [...(f.opts || [])]; if (v && !opts.includes(v)) opts.unshift(v);
      return el('select', common, el('option', { value: '', selected: !v, text: '–' }), opts.map((o) => el('option', { value: o, selected: o === v, text: o }))); }
    default: return el('input', { ...common, type: f.id === 'mail' ? 'email' : f.id === 'tel' ? 'tel' : 'text', maxlength: 200, value: v ?? '' });
  }
}
function personCard(x, i) {
  const prop = (label, input, cls = '') => el('label', { class: 'p-prop' + cls }, el('span', { class: 'p-label', text: label }), input);
  return el('li', {}, el('details', { class: 'person', 'data-sec': 'p-' + x.id, open: setOpen.has('p-' + x.id) },
    el('summary', {},
      el('span', { class: `avatar c-${AV_COLORS[i % AV_COLORS.length]}`, 'aria-hidden': 'true', text: (x.name.trim()[0] || '?').toUpperCase() }),
      el('span', { class: 'p-head' }, el('span', { class: 'p-name', text: x.name }), el('small', { class: 'p-hint', text: personHint(x) }))),
    el('div', { class: 'p-body' },
      prop('Namn', el('input', { type: 'text', maxlength: 30, value: x.name, 'data-act': 'pname', 'data-id': x.id, autocomplete: 'off' })),
      isChild(x) ? null : prop('Arbetstid', el('span', { class: 'p-unit' }, el('input', { type: 'text', inputmode: 'decimal', value: String(x.h ?? WEEK_HOURS).replace('.', ','), 'data-act': 'phours', 'data-id': x.id, 'aria-label': 'Arbetstid, timmar per vecka', autocomplete: 'off' }), el('span', { text: 'tim/vecka' }))),
      S.state.pfields.map((f) => prop(f.name, propInput(x, f), f.kind === 'check' ? ' p-check' : f.kind === 'note' ? ' p-wide' : '')),
      el('button', { class: 'link danger', 'data-act': 'pdel', 'data-id': x.id, text: `Ta bort ${x.name}` }))));
}
// Egenskaper: the list of properties every person has – rename, kind, order, choices, remove (with Ångra), add.
function propsEditor() {
  const kinds = PERSON_KINDS.map((k) => [k, KINDS[k]]);
  return el('details', { class: 'props-ed', 'data-sec': 'pprops', open: setOpen.has('pprops') },
    el('summary', { class: 'sub-h', text: `Egenskaper (${S.state.pfields.length})` }),
    el('p', { class: 'muted small', text: 'Gäller alla personer. Ändra namn och sort, flytta upp eller lägg till egna, t.ex. Allergier eller Skostorlek. Tar du bort en egenskap tas värdet bort hos alla (Ångra finns).' }),
    el('ul', { class: 'edit-list' }, S.state.pfields.map((f, i) => el('li', { class: 'field-edit' },
      el('input', { type: 'text', maxlength: 40, value: f.name, 'aria-label': 'Egenskapens namn', 'data-act': 'pfname', 'data-i': i, autocomplete: 'off' }),
      el('select', { 'data-act': 'pfkind', 'data-i': i, 'aria-label': 'Sort' }, kinds.map(([k, l]) => el('option', { value: k, selected: k === f.kind, text: l }))),
      el('button', { class: 'icon sm', 'data-act': 'pfup', 'data-i': i, 'aria-label': 'Flytta upp', disabled: i === 0, text: '↑' }),
      el('button', { class: 'icon sm danger', 'data-act': 'pfdel', 'data-i': i, 'aria-label': `Ta bort ${f.name}`, text: '✕' }),
      f.kind === 'choice' ? el('textarea', { class: 'opts-edit', rows: 3, 'aria-label': `Val för ${f.name}, ett per rad`, placeholder: 'Val, ett per rad', 'data-act': 'pfopts', 'data-i': i, text: (f.opts || []).join('\n') }) : null))),
    S.state.pfields.length < LIM.pfields ? el('button', { class: 'link', 'data-act': 'pfnew', text: '+ Ny egenskap' }) : null);
}

export const trashLabel = (d) => (d ? `Efter ${d === 365 ? '1 år' : d + ' dagar'}` : 'Aldrig');

// Remembered backup password: on by default – the password typed at the first backup is kept. Visa, Byt; unticking forgets it.
function pwdBox() {
  const p = savedPassword(), on = rememberOn();
  return el('div', { class: 'pwd-box' },
    el('label', { class: 'check' }, el('input', { type: 'checkbox', checked: on, 'data-act': 'pwdremember' }), el('span', { text: 'Kom ihåg backup-lösenordet på den här enheten' })),
    !on ? el('p', { class: 'muted small', text: 'Appen frågar efter lösenordet varje gång.' })
      : !p ? el('p', { class: 'muted small', text: 'Lösenordet du skriver vid nästa backup sparas – sedan räcker ett tryck. Filen är lika skyddad som förut.' })
      : el('div', { class: 'pwd-card' },
        el('div', { class: 'pwd-head' }, el('span', { text: '🔑 Lösenordet är sparat' }),
          el('button', { class: 'link', 'data-act': 'pwdshow', 'aria-pressed': S.showPwd ? 'true' : 'false', text: S.showPwd ? 'Dölj' : 'Visa' }),
          el('button', { class: 'link', 'data-act': 'pwdset', text: 'Byt' })),
        S.showPwd ? el('p', { class: 'pwd-show', text: p }) : null,
        el('p', { class: 'muted small pwd-note', text: 'Backup sparas med ett tryck. Ha lösenordet kvar i din lösenordshanterare – utan det går backupen inte att öppna på en ny telefon.' })));
}
