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
  push(Sample.Bar);

  return items;
}

/**
 * Helpers:
 */
function renderer(state: DebugSignals, opts: Options = {}) {
  return ActionProbe.renderer<DebugSignals, TEnv>({
    state,
    style: { MarginY: 20, MarginX: 10 },
    resolve: ({ state, probe, spec }) => {
      const v = Signal.toObject(state.props);
      const local = v.env === 'localhost';
      return {
        env: { is: { local } },
        spinning: v.spinning && v.probe.active === probe,
        focused: v.probe.focused === probe,
        actOn: v.actOn,
        theme: opts.theme ?? v.theme,
        debug: v.debug,
        ...state.action.handlers(probe),
        onFocus: () => {
          state.action.focus(probe);
          state.action.resultVisible(true);
          state.props.result.title.value = spec.title;
        },
        onBlur: () => state.action.blur(probe),
      };
    },
  });
}
