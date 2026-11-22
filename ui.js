// Shared UI state and helpers for app.js and views/*.js. Rendering only via el() (Trusted Types).
import { load, dateKey, parseKey } from './store.js';

export const today = () => dateKey(new Date());
// Mutable UI state shared by all views (one object, so modules see changes).
export const S = {
  state: load(),
  open: null,          // Ärenden/Arkiv: id of the open case (a layer, see nav.js)
  pick: false,         // Nytt ärende: rubrik + mallar (a layer)
  newTitle: '',        // Nytt ärende: rubrik, kept across re-renders
  pfilter: 'all',      // Ärenden: person filter ('-' = no one)
  alimit: 100,         // Arkiv: rows shown (Visa fler adds 100)
  trash: false,        // Inställningar: Papperskorg open (a layer)
  q: '',               // Arkiv: search text
  draft: null,         // Nytt ärende (2026-11-22): ett ärende som inte sparats än – sparas när det får en rubrik
  installPrompt: null,
};
// The open case: the unsaved draft or a saved case.
export const cur = () => (S.draft && S.open === S.draft.id ? S.draft : S.state.cases.find((x) => x.id === S.open));
export const setOpen = new Set();   // Inställningar: open sections (data-sec), kept across re-renders
export const longDate = (k) => parseKey(k).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short', year: 'numeric' });
export const shortDate = (k) => parseKey(k).toLocaleDateString('sv-SE', { day: 'numeric', month: 'numeric' });

/* ---------- DOM helpers (textContent + setAttribute only – Trusted Types) ---------- */
export function el(tag, props = {}, ...children) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k === 'text') n.textContent = v;
    else if (k === 'class') n.className = v;
    else if (k === 'value' && (tag === 'input' || tag === 'textarea')) n.value = v;
    else if (/^(on|style$|href$|src$|srcset$|action$|formaction$|xlink:href$)/i.test(k)) throw new Error('el: unsafe attribute ' + k);
    else n.setAttribute(k, v === true ? '' : String(v));
  }
  for (const c of children.flat(Infinity)) if (c != null && c !== false) n.append(c);
  return n;
}
