import { type t, ActionProbe, Signal } from './common.ts';

/**
 * Data-card signal helper.
 * Wraps ActionProbe signals with card-selection state.
 */
export function createSignals(
  input: t.DataCardSignalsDefaults = {},
): t.DataCardSignals {
  const action = ActionProbe.Signals.create(input.action);
  const s = Signal.create;
  const props: t.DataCardSignalsProps = {
    ...action.props,
    selectionList: { totalVisible: s(input.totalVisible ?? 5) },
    treeContent: {
      ref: s(input.treeContent?.ref),
      refs: s(input.treeContent?.refs),
    },
    treePlayback: {
      ref: s(input.treePlayback?.ref),
      refs: s(input.treePlayback?.refs),
    },
  };

  const api: t.DataCardSignals = {
    get props() {
      return props;
    },
    handlers: action.handlers,
    start: action.start,
    focus: action.focus,
    blur: action.blur,
    item: action.item,
    result: action.result,
    end: action.end,
    reset() {
      action.reset();
      props.selectionList.totalVisible.value = input.totalVisible ?? 5;
      props.treeContent.ref.value = input.treeContent?.ref;
      props.treeContent.refs.value = input.treeContent?.refs;
      props.treePlayback.ref.value = input.treePlayback?.ref;
      props.treePlayback.refs.value = input.treePlayback?.refs;
      return api;
    },
  };

  return api;
}
