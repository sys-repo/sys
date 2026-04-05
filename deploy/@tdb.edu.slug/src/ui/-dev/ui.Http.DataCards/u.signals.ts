import { type t, ActionProbe, Is, Signal } from './common.ts';

/**
 * Data-card signal helper.
 * Wraps ActionProbe signals with card-selection state.
 */
export function createSignals(
  input: t.DataCardSignalsDefaults = {},
): t.DataCardSignals {
  const action = ActionProbe.Signals.create(wrangle.actionInput(input));
  const s = Signal.create;
  const props: t.DataCardSignalsProps = {
    ...action.props,
    selectionList: { totalVisible: s(input.totalVisible ?? 3) },
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
    resultVisible: action.resultVisible,
    item: action.item,
    result: action.result,
    end: action.end,
    reset() {
      action.reset();
      props.selectionList.totalVisible.value = input.totalVisible ?? 3;
      props.treeContent.ref.value = input.treeContent?.ref;
      props.treeContent.refs.value = input.treeContent?.refs;
      props.treePlayback.ref.value = input.treePlayback?.ref;
      props.treePlayback.refs.value = input.treePlayback?.refs;
      return api;
    },
  };

  return api;
}

const wrangle = {
  actionInput(input: t.DataCardSignalsDefaults): Parameters<t.ActionProbe.SignalsFactory>[0] {
    const action = input.action;
    const hasPersist = input.persist !== undefined || input.persistKey !== undefined;
    if (!hasPersist) return action;

    if (wrangle.isCreateArgs(action)) {
      return {
        ...action,
        persist: input.persist ?? action.persist,
        persistKey: input.persistKey ?? action.persistKey,
      };
    }

    return {
      defaults: action,
      persist: input.persist,
      persistKey: input.persistKey,
    };
  },

  isCreateArgs(
    input: unknown,
  ): input is {
    readonly defaults?: Partial<t.ActionProbe.SignalsState>;
    readonly persist?: t.ImmutableRef<t.JsonMapU>;
    readonly persistKey?: string;
  } {
    if (!Is.object(input)) return false;
    return 'defaults' in input || 'persist' in input || 'persistKey' in input;
  },
} as const;
