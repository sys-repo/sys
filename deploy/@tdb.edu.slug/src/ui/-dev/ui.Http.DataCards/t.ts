import type { t } from './common.ts';

/**
 * Flags for enumerating the kinds of data-cards available.
 */
export type DataCardKind = (typeof DataCardKindKinds)[number];
export const DataCardKindKinds = ['descriptor', 'file-content', 'playback-content'] as const;

/** Ref selector state (`selected` + `choices`). */
export type DataCardRefState = {
  readonly ref: t.Signal<string | undefined>;
  readonly refs: t.Signal<string[] | undefined>;
};

/** DataCards signal bag (ActionProbe + card domain state). */
export type DataCardSignalsProps = t.ActionProbeSignalProps & {
  readonly selectionList: {
    readonly totalVisible: t.Signal<number | 'all' | undefined>;
  };
  readonly treeContent: DataCardRefState;
  readonly treePlayback: DataCardRefState;
};

/** Optional initial values for `createSignals()`. */
export type DataCardSignalsDefaults = {
  readonly totalVisible?: number | 'all';
  readonly treeContent?: { readonly ref?: string; readonly refs?: string[] };
  readonly treePlayback?: { readonly ref?: string; readonly refs?: string[] };
  readonly action?: Partial<t.ActionProbeSignalsState>;
};

/** Runtime API returned by `DataCards.createSignals`. */
export type DataCardSignals = t.ActionProbeSignals & {
  readonly props: DataCardSignalsProps;
};
