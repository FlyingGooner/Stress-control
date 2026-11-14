// nav.js – pure navigation logic for Bakåt (as simple-nutrition v0.14). No DOM, no storage: tested in Node
// (tools/tests/nav.node.mjs). Layers, topmost first: type picker (pick), open case (open), type editor (tedit).

export function topLayer(S) {
  if (S.pick) return 'pick';
  if (S.open) return 'open';
  if (S.tedit) return 'tedit';
  return null;
}
export const layerDepth = (S) => (S.pick ? 1 : 0) + (S.open ? 1 : 0) + (S.tedit ? 1 : 0);
// Closes the topmost layer. Returns true if something closed.
export function closeTop(S) {
  const l = topLayer(S);
  if (l === 'pick') S.pick = false;
  else if (l === 'open') S.open = null;
  else if (l === 'tedit') S.tedit = null;
  return l !== null;
}
// Unsaved changes: the draft differs from the copy taken when the editor opened.
export const isDirty = (draft, orig) => !!draft && JSON.stringify(draft) !== orig;
