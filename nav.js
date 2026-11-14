// nav.js – pure navigation logic for Bakåt (same pattern as simple-nutrition). No DOM, no storage: tested in Node
// (tools/tests/nav.node.mjs). Layers, topmost first: type picker (pick), type editor (tedit), case edit mode (edit), open case (open), sub-goal list (steps),
// Papperskorg (trash, in Inställningar), markeringsläge i Trådar (sel).

export function topLayer(S) {
  if (S.pick) return 'pick';
  if (S.tedit) return 'tedit';   // above an open case: "Skapa ny typ" opens the editor from a case
  if (S.open && S.edit) return 'edit';   // a case's edit mode lies above its view
  if (S.open) return 'open';
  if (S.steps) return 'steps';   // all open sub-goals (Överblick); a case opens above it
  if (S.trash) return 'trash';   // Papperskorg (Inställningar)
  if (S.sel) return 'sel';       // Trådar: several cases marked (long press)
  return null;
}
export const layerDepth = (S) => (S.pick ? 1 : 0) + (S.open ? 1 : 0) + (S.open && S.edit ? 1 : 0) + (S.tedit ? 1 : 0) + (S.steps ? 1 : 0) + (S.trash ? 1 : 0) + (S.sel ? 1 : 0);
// Closes the topmost layer. Returns true if something closed.
export function closeTop(S) {
  const l = topLayer(S);
  if (l === 'pick') { S.pick = false; S.draft = null; }
  else if (l === 'tedit') { S.tedit = null; S.teditFor = null; }
  else if (l === 'edit') S.edit = false;
  else if (l === 'open') S.open = null;
  else if (l === 'steps') S.steps = false;
  else if (l === 'trash') S.trash = false;
  else if (l === 'sel') S.sel = null;
  return l !== null;
}
// Unsaved changes: the draft differs from the copy taken when the editor opened.
export const isDirty = (draft, orig) => !!draft && JSON.stringify(draft) !== orig;
