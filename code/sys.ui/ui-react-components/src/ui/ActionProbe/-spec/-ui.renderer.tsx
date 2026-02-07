import { type t, Signal } from '../common.ts';
import { ActionProbe } from '../mod.ts';
import type { DebugSignals } from './-SPEC.Debug.tsx';

type TEnv = { readonly is: { readonly local: boolean } };
type Options = { theme?: t.CommonTheme };

export function renderer(state: DebugSignals, opts: Options = {}) {
  return ActionProbe.renderer<DebugSignals, TEnv>({
    state,
    style: { MarginY: 8, MarginX: 15 },
    resolve: ({ state, probe }) => {
      const v = Signal.toObject(state.props);
      const local = v.env === 'localhost';
      const action = state.action;
      return {
        env: { is: { local } },
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
