import type { t } from './common.ts';

/**
 * Controller Hook:
 */
export type UseRepoHook = (args?: UseRepoHookArgs | RepoHook) => RepoHook;

export type UseRepoHookArgs = {
  signals?: Partial<RepoHookSignals>;
};

export type RepoHook = {
  readonly ready: boolean;
  readonly instance: t.StringId;
  readonly signals: t.RepoHookSignals;
};

export type RepoHookSignals = {
  readonly repo: t.Signal<t.CrdtRepo | undefined>;
  readonly syncEnabled: t.Signal<boolean>;
  toValues(): RepoHookSignalValues;
};

export type RepoHookSignalValues = {
  readonly repo?: t.SignalValue<RepoHookSignals['repo']>;
  readonly syncEnabled: t.SignalValue<RepoHookSignals['syncEnabled']>;
};
