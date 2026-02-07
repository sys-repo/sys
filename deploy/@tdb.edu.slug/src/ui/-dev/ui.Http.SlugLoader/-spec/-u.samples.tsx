import { Sample } from '../-spec.samples/mod.ts';
import { type t, ActionProbe, Signal } from './common.ts';

type Options = { theme?: t.CommonTheme };
type TEnv = {
  readonly is: { readonly local: boolean };
  readonly origin: t.SlugUrlOrigin;
  readonly probe?: t.TEnv['probe'];
};

/**
 * Samples index:
 */
export function renderSamples(debug: t.DebugSignals, opts: Options = {}) {
  const { items, push } = renderer(debug, opts);
  push(Sample.Descriptor);
  push(Sample.TreeContent);
  push(Sample.TreePlaybackAssets);
  return items;
}

/**
 * Helpers
 */
function renderer(state: t.DebugSignals, opts: Options = {}) {
  return ActionProbe.renderer<t.DebugSignals, TEnv>({
    state,
    style: { MarginY: 20 },
    resolve: ({ state, probe }) => {
      const v = Signal.toObject(state.props);
      const local = v.env === 'localhost';
      const origin = v.origin;
      if (!origin) return undefined;
      return {
        env: {
          is: { local },
          origin,
          probe: {
            descriptor: {
              kind: v.descriptorKind,
              onKindChange: (next) => (state.props.descriptorKind.value = next),
            },
            treeContent: {
              ref: v.treeContentRef,
              refs: v.treeContentRefs,
              onRefChange: (next) => (state.props.treeContentRef.value = next),
              onRefsChange: (next) => (state.props.treeContentRefs.value = next),
            },
          },
        },
        spinning: v.spinning && v.probe.active === probe,
        focused: v.probe.focused === probe,
        theme: opts.theme ?? v.theme,
        debug: v.debug,
        ...state.action.handlers(probe),
        onFocus: () => state.action.focus(probe),
        onBlur: () => state.action.blur(probe),
      };
    },
  });
}
