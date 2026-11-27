// nav.js – pure navigation logic for Bakåt (same pattern as simple-nutrition). No DOM, no storage: tested in Node
// (tools/tests/nav.node.mjs). Layers, topmost first: Nytt ärende (pick), open case (open), Papperskorg (trash, in Inställningar).

export function topLayer(S) {
  if (S.pick) return 'pick';
  if (S.open) return 'open';
  if (S.trash) return 'trash';
  return null;
}
export const layerDepth = (S) => (S.pick ? 1 : 0) + (S.open ? 1 : 0) + (S.trash ? 1 : 0);
// Closes the topmost layer. Returns true if something closed.
export function closeTop(S) {
  const l = topLayer(S);
  if (l === 'pick') S.pick = false;
  else if (l === 'open') { S.open = null; S.draft = null; }   // an unsaved Nytt ärende is dropped with it
  else if (l === 'trash') S.trash = false;
  return l !== null;
}
