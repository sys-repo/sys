import type { PropArgs } from './common.types.ts';

import { DEFAULTS, Edges, Id, type t } from './common.ts';
import { CtxPanelEdge } from './Ctx.PanelEdge.ts';

export function CtxPropsDebug(props: PropArgs) {
  const { events } = props;
  const DEBUG = DEFAULTS.props.debug;

  const api: t.DevCtxDebug = {
    row(input) {
      const id = Id.renderer.create();
      const fn = typeof input === 'function' ? input : () => input;
      const redraw = () => events.redraw.fire({ renderers: [id] });
      props.current().debug.body.renderers.push({ id, fn });
      props.changed();
      return { id, redraw };
    },

    scroll(value) {
      props.current().debug.body.scroll = value;
      props.changed();
      return api;
    },

    padding(input) {
      const value = Edges.toArray(input ?? DEBUG.body.padding);
      props.current().debug.body.padding = value;
      props.changed();
      return api;
    },

    width(input) {
      const value = Wrangle.width(input, DEFAULTS.props.debug.width);
      props.current().debug.width = value;
      props.changed();
      return api;
    },

    header: CtxPanelEdge(DEBUG.header, (fn) => {
      fn(props.current().debug.header);
      props.changed();
    }),

    footer: CtxPanelEdge(DEBUG.footer, (fn) => {
      fn(props.current().debug.footer);
      props.changed();
    }),
  };

  return api;
}

/**
 * [Helpers]
 */

const Wrangle = {
  width(value?: number | null, defaultValue?: number | null) {
    if (value === null) return null;
    if (typeof value !== 'number') return defaultValue;
    return Math.max(0, value);
  },
};
