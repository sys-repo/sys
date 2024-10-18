import type { PropArgs } from './common.types.ts';

import { CtxPanelEdge } from './Ctx.PanelEdge.ts';
import { DEFAULTS, Edges, Id, type t } from './common.ts';

const HOST = DEFAULTS.props.host;

export function CtxPropsHost(props: PropArgs) {
  const api: t.DevCtxHost = {
    backgroundColor(value) {
      if (value === null) value = HOST.backgroundColor!;
      props.current().host.backgroundColor = value;
      props.changed();
      return api;
    },
    color(value) {
      if (value === null) value = HOST.color!;
      props.current().host.color = value;
      props.changed();
      return api;
    },
    tracelineColor(value) {
      if (value === null) value = HOST.tracelineColor!;
      props.current().host.tracelineColor = value;
      props.changed();
      return api;
    },
    backgroundImage(value) {
      props.current().host.backgroundImage = wrangle.backgroundImage(value);
      props.changed();
      return api;
    },

    layer(index: number) {
      if (index === 0) throw new Error(`The index-0 layer is reserved for the main subject.`);

      const layer: t.DevCtxLayer = {
        index,
        render(input) {
          const id = Id.renderer.create();
          const fn = typeof input === 'function' ? input : () => input;
          const host = props.current().host;
          host.layers[index.toString()] = { index, renderer: { id, fn } };
          props.changed();
          return layer;
        },
      };

      return layer;
    },

    header: CtxPanelEdge(HOST.header, (fn) => {
      fn(props.current().host.header);
      props.changed();
    }),
    footer: CtxPanelEdge(HOST.footer, (fn) => {
      fn(props.current().host.footer);
      props.changed();
    }),
  };
  return api;
}

/**
 * Helpers
 */
const wrangle = {
  backgroundImage(
    input: string | t.DevBackgroundImageInput | null,
  ): t.DevBackgroundImage | undefined {
    if (input === null || input === undefined) return;

    if (typeof input === 'string') {
      const url = input.trim();
      if (!url) return;
      return {
        url,
        size: HOST.backgroundImage?.size,
        margin: HOST.backgroundImage?.margin,
      };
    }

    const url = (input.url || '').trim();
    const margin = Edges.toArray(input.margin, 0);
    const size = input.size ?? HOST.backgroundImage?.size;
    const opacity = input.opacity;

    return { url, margin, size, opacity };
  },
} as const;
