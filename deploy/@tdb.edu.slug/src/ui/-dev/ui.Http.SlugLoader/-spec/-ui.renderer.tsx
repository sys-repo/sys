import { type t, Signal, ActionProbe } from './common.ts';

type Options = { theme?: t.CommonTheme };
type TEnv = {
  readonly is: { readonly local: boolean };
  readonly origin: t.SlugUrlOrigin;
};

export function renderer(state: t.DebugSignals, opts: Options = {}) {
  return ActionProbe.renderer<t.DebugSignals, TEnv>({
    state,
    style: { MarginY: 8, MarginX: 15 },
    resolve: ({ state, probe }) => {
      const v = Signal.toObject(state.props);
      const origin = v.origin;
      if (!origin) return undefined;
      const local = v.env === 'localhost';
      const action = state.action;
      return {
        env: { is: { local }, origin },
        spinning: v.spinning && v.probe.active === probe,
        theme: opts.theme ?? v.theme,
        debug: v.debug,
        onRunStart: () => action.start(probe),
        onRunEnd: () => action.end(),
        onRunResult: (value) => action.result(value),
        onRunItem: (item) => action.item(item),
      };
    },
  });
}
