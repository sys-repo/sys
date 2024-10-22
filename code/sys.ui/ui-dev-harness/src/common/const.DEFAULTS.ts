import type * as t from './t.ts';

import { Color } from '@sys/ui-dom/style';
import { COLORS } from './const.COLORS.ts';

export const DEFAULTS = {
  get size(): t.DevRenderedSize {
    return {
      harness: { width: -1, height: -1 },
      host: { width: -1, height: -1 },
      subject: { width: -1, height: -1 },
      debug: { width: -1, height: -1 },
    };
  },

  get props(): t.DevRenderProps {
    return {
      host: {
        color: COLORS.DARK,
        backgroundColor: Color.alpha(COLORS.DARK, 0.02),
        tracelineColor: Color.alpha(COLORS.DARK, 0.05),
        backgroundImage: { url: '', size: 'cover', margin: [0, 0, 0, 0] },
        header: { border: { color: -0.1 }, padding: [8, 8, 8, 8] },
        footer: { border: { color: -0.1 }, padding: [8, 8, 8, 8] },
        layers: {},
      },
      subject: {},
      debug: {
        width: 400,
        header: { border: {}, padding: [8, 8, 8, 8] },
        body: {
          renderers: [],
          scroll: true,
          padding: [15, 15, 15, 15],
        },
        footer: { border: {}, padding: [8, 8, 8, 8] },
      },
      size: DEFAULTS.size,
    };
  },

  get info(): t.DevInfo {
    return {
      instance: { kind: 'dev:harness', session: '', bus: '' },
      render: { revision: { props: 0, state: 0 } },
      run: { count: 0 },
    };
  },

  /**
   * URL query-string keys.
   */
  get qs(): t.DefaultsQueryString {
    return {
      d: 'd', // NB: alias for "?dev"
      dev: 'dev',
      selected: 'selected',
      filter: 'filter',
    };
  },
} as const;
