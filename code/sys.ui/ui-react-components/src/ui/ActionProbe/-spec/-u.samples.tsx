import { Sample } from '../-spec.samples/mod.ts';
import { type t, Signal } from '../common.ts';
import { ActionProbe } from '../mod.ts';
import type { DebugSignals } from './-SPEC.Debug.tsx';

type TEnv = { is: { local: boolean } };
type Options = { theme?: t.CommonTheme };

/**
 * Samples index:
 */
export function renderSamples(debug: DebugSignals, opts: Options = {}) {
  const { items, push, hr } = renderer(debug, opts);

  push(Sample.Foo);
  hr();
  push(Sample.create('My Sample'));

  return items;
}

/**
 * Helpers:
 */
function renderer(state: DebugSignals, opts: Options = {}) {
  return ActionProbe.renderer<DebugSignals, TEnv>({
    state,
    style: { MarginY: 15, MarginX: 15 },
    resolve: ({ state, probe, sample }) => {
      const v = Signal.toObject(state.props);
      const local = v.env === 'localhost';
      return {
        env: { is: { local } },
        spinning: v.spinning && v.probe.active === probe,
        theme: opts.theme ?? v.theme,
        debug: v.debug,
        ...state.action.handlers(probe, sample.title),
      };
    },
  });
}
