import type { t } from './common.ts';

/**
 * Controller Hook:
 */
export type UseRepoHook = (args?: UseRepoHookArgs | RepoHook) => RepoHook;

export type UseRepoHookArgs = {
  factory?: RepoHookFactory;
  signals?: Partial<RepoHookSignals>;
  silent?: boolean;
  localstorageKey?: t.StringId;
};

export type RepoHook = {
  readonly instance: t.StringId;
  readonly signals: t.RepoHookSignals;
  readonly repo: t.CrdtRepo | undefined;
  readonly handlers: {
    onSyncEnabledChange(e: { enabled: boolean }): void;
  };
};

export type RepoHookSignals = {
  readonly repo: t.Signal<t.CrdtRepo | undefined>;
  readonly syncEnabled: t.Signal<boolean | undefined>;
  toValues(): RepoHookSignalValues;
};

export type RepoHookSignalValues = {
  readonly repo?: t.SignalValue<RepoHookSignals['repo']>;
  readonly syncEnabled: t.SignalValue<RepoHookSignals['syncEnabled']>;
};

export type RepoHookFactory = (args: RepoHookFactoryArgs) => t.CrdtRepo | undefined;
export type RepoHookFactoryArgs = { readonly syncEnabled?: boolean };
