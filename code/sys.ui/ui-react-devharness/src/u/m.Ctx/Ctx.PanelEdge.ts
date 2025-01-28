import { Edges, Id, type t } from './common.ts';

/**
 * The edge of a panel (eg header/footer).
 */
export function CtxPanelEdge(
  defaults: t.DevRenderPropsEdge,
  change: (fn: (edge: t.DevRenderPropsEdge) => void) => void,
) {
  const api: t.DevCtxEdge = {
    render(input) {
      const id = Id.renderer.create();
      const fn = typeof input === 'function' ? input : () => input;
      change((e) => (e.renderer = { id, fn }));
      return api;
    },
    border(color) {
      if (color === null) color = defaults.border.color!;
      change((e) => (e.border.color = color!));
      return api;
    },
    padding(input) {
      const value = Edges.toArray(input ?? defaults.padding);
      change((e) => (e.padding = value));
      return api;
    },
  };

  return api;
}
