// Shared UI state and helpers for app.js and views/*.js. Rendering only via el() (Trusted Types).
import { load, dateKey, parseKey } from './store.js';

export const today = () => dateKey(new Date());
// Mutable UI state shared by all views (one object, so modules see changes).
export const S = {
  state: load(),
  edit: false,         // the open case is in edit mode (a layer above its view)
  open: null,          // Ärenden/Arkiv: id of the open case (a layer, see nav.js)
  pick: false,         // Ärenden: type picker for a new case is open (a layer)
  newTitle: '',        // Nytt ärende: rubrik, kept across re-renders
  draft: null,         // Nytt ärende: { t, f } – chosen type and field values before Skapa
  tedit: null,         // Inställningar: case type draft being edited (a layer) or null
  teditOrig: '',       // JSON copy of the draft when the editor opened (unsaved changes → "Släng ändringarna?")
  filter: 'all',       // Ärenden: category filter
  afilter: 'all',      // Arkiv: category filter
  pfilter: 'all',      // Trådar: person filter ('-' = no one)
  apfilter: 'all',     // Arkiv: person filter
  alimit: 100,         // Arkiv: rows shown (Visa fler adds 100)
  tfilter: 'all',      // Papperskorg: category filter
  trash: false,        // Inställningar: Papperskorg open (a layer)
  q: '',               // Arkiv: search text
  sel: null,           // Trådar: ids of marked cases (markeringsläge, a layer) or null
  installPrompt: null,
};
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
