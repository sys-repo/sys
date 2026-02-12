import { type t, ActionProbe, Signal } from './common.ts';
import { DataCards } from '../mod.ts';

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
  const Card = DataCards.Card;
  push(Card.Descriptor);
  push(Card.TreeContent);
  push(Card.TreePlaybackAssets);
  return items;
}

/**
 * Helpers
 */
function renderer(state: t.DebugSignals, opts: Options = {}) {
  const DEFAULT_VISIBLE = 3;
  const actOn: t.ActionProbe.ActOn = ['Enter', 'Cmd+Click'];

  return ActionProbe.renderer<t.DebugSignals, TEnv>({
    state,
    style: { MarginY: 20 },
    resolve({ state, probe, spec }) {
      const v = Signal.toObject(state.props);
      const local = v.env === 'localhost';
      const origin = v.origin;
      if (!origin) return undefined;
      return {
        env: {
          is: { local },
          origin,
          probe: {
            selectionList: {
              totalVisible: v.listTotalVisible ?? DEFAULT_VISIBLE,
            },
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
            treePlayback: {
              ref: v.treePlaybackRef,
              refs: v.treePlaybackRefs,
              onRefChange: (next) => (state.props.treePlaybackRef.value = next),
              onRefsChange: (next) => (state.props.treePlaybackRefs.value = next),
            },
          },
        },
        spinning: v.spinning && v.probe.active === probe,
        focused: v.probe.focused === probe,
        actOn,
        theme: opts.theme ?? v.theme,
        debug: v.debug,
        ...state.action.handlers(probe, spec.title),
        onFocus: () => state.action.focus(probe, spec.title),
        onBlur: () => state.action.blur(probe),
      };
    },
  });
}
