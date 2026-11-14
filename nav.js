// nav.js – pure navigation logic for Bakåt (same pattern as simple-nutrition). No DOM, no storage: tested in Node
// (tools/tests/nav.node.mjs). Layers, topmost first: type picker (pick), type editor (tedit), open case (open).

export function topLayer(S) {
  if (S.pick) return 'pick';
  if (S.tedit) return 'tedit';   // above an open case: "Skapa ny typ" opens the editor from a case
  if (S.open) return 'open';
  return null;
}
export const layerDepth = (S) => (S.pick ? 1 : 0) + (S.open ? 1 : 0) + (S.tedit ? 1 : 0);
// Closes the topmost layer. Returns true if something closed.
export function closeTop(S) {
  const l = topLayer(S);
  if (l === 'pick') { S.pick = false; S.draft = null; }
  else if (l === 'tedit') { S.tedit = null; S.teditFor = null; }
  else if (l === 'open') S.open = null;
  return l !== null;
}
// Unsaved changes: the draft differs from the copy taken when the editor opened.
export const isDirty = (draft, orig) => !!draft && JSON.stringify(draft) !== orig;
