import { type t, ActionProbe, Signal } from './common.ts';

type RefState = {
  readonly ref: t.Signal<string | undefined>;
  readonly refs: t.Signal<string[] | undefined>;
};

type Props = t.ActionProbeSignalProps & {
  readonly selectionList: {
    readonly totalVisible: t.Signal<number | 'all' | undefined>;
  };
  readonly treeContent: RefState;
  readonly treePlayback: RefState;
};

type CreateDefaults = {
  readonly totalVisible?: number | 'all';
  readonly treeContent?: { readonly ref?: string; readonly refs?: string[] };
  readonly treePlayback?: { readonly ref?: string; readonly refs?: string[] };
  readonly action?: Partial<t.ActionProbeSignalsState>;
};

export type DataCardSignals = t.ActionProbeSignals & {
  readonly props: Props;
};

/**
 * Data-card signal helper.
 * Wraps ActionProbe signals with card-selection state.
 */
export function createSignals(input: CreateDefaults = {}): DataCardSignals {
  const action = ActionProbe.Signals.create(input.action);
  const s = Signal.create;
  const props: Props = {
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

  const api: DataCardSignals = {
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
