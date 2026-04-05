import type { t } from './common.ts';

/**
 * Flags for enumerating the kinds of data-cards available.
 */
export type DataCardKind = (typeof DataCardKindKinds)[number];
/** Supported data-card kinds. */
export const DataCardKindKinds = ['descriptor', 'file-content', 'playback-content'] as const;

/** Ref selector state (`selected` + `choices`). */
export type DataCardRefState = {
  readonly ref: t.Signal<string | undefined>;
  readonly refs: t.Signal<string[] | undefined>;
};

/** DataCards signal bag (ActionProbe + card domain state). */
export type DataCardSignalsProps = t.ActionProbe.SignalProps & {
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
  readonly action?: Parameters<t.ActionProbe.SignalsFactory>[0];
  readonly persist?: t.ImmutableRef<t.JsonMapU>;
  readonly persistKey?: string;
};

/** Runtime API returned by `DataCards.createSignals`. */
export type DataCardSignals = t.ActionProbe.Signals & {
  readonly props: DataCardSignalsProps;
};

/** Render args for `createPanel(args)`. */
export type DataCardPanelArgs = {
  readonly signals: DataCardSignals;
  readonly kind?: DataCardKind;
  readonly kinds?: DataCardKind[];
  readonly showKindSelector?: boolean;
  readonly env?: t.HttpOrigin.Env;
  readonly origin?: t.SlugUrlOrigin;
  readonly theme?: t.CommonTheme;
  readonly debug?: boolean;
  readonly style?: t.CssInput;
  readonly onKindSelect?: (kind: DataCardKind) => void;
};

/** Parsed view model from a Tree+Content probe response. */
export type DataCardTreeContentResponse = {
  readonly tree: t.TreeHostViewNodeList;
};
