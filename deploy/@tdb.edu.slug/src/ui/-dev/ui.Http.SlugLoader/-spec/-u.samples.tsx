import { Sample } from '../-spec.samples/mod.ts';
import { type t, ActionProbe, Signal } from './common.ts';

type Options = { theme?: t.CommonTheme };
type TEnv = {
  readonly is: { readonly local: boolean };
  readonly origin: t.SlugUrlOrigin;
};

/**
 * Samples index:
 */
export function renderSamples(debug: t.DebugSignals, opts: Options = {}) {
  const { items, push } = renderer(debug, opts);
  push(Sample.Descriptor);
  push(Sample.TreeContent);
  return items;
}

/**
 * Helpers
 */
function renderer(state: t.DebugSignals, opts: Options = {}) {
  return ActionProbe.renderer<t.DebugSignals, TEnv>({
    state,
    style: { MarginY: 8 },
    resolve: ({ state, probe }) => {
      const v = Signal.toObject(state.props);
      const local = v.env === 'localhost';
      const origin = v.origin;
      if (!origin) return undefined;
      return {
        env: { is: { local }, origin },
        spinning: v.spinning && v.probe.active === probe,
        theme: opts.theme ?? v.theme,
        debug: v.debug,
        ...state.action.handlers(probe),
      };
    },
  });
}
