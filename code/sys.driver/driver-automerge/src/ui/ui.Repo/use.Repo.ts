import { useRef } from 'react';
import { type t, D, Is, Signal, slug } from './common.ts';

type Args = t.UseRepoHookArgs;
type Hook = t.RepoHook;

/**
 * Hook (or passthough):
 */
export const useRepo: t.UseRepoHook = (input: Hook | Args = {}) => {
  return isHook(input)
    ? input //                ← Controlled   (passed in hook)
    : useInternal(input); //  ← Uncontrolled (manage hook locally)
};

/**
 * Internal (always runs full hook list):
 */
function useInternal(args: Args = {}): Hook {
  const { silent = D.silent } = args;
  const instance = useRef(slug()).current;

  /**
   * Refs:
   */
  const signalsRef = useRef<t.RepoHookSignals>(wrangle.signals(args));
  const signals = signalsRef.current;

  /**
   * Effect:
   */
  Signal.useEffect(() => {
    const syncEnabled = signals.syncEnabled.value;
    const repo = args.factory?.({ syncEnabled });
    signals.repo.value = repo;
    if (!silent) console.info(`🧫 repo:`, repo);
  });

  Signal.useRedrawEffect(() => {
    signals.syncEnabled.value;
    signals.repo.value;
  });

  /**
   * Handlers:
   */
  const handlers: t.RepoHook['handlers'] = {
    onSyncEnabledChange: (e) => (signals.syncEnabled.value = e.enabled),
  };

  /**
   * API:
   */
  const api: t.RepoHook = {
    instance,
    signals,
    handlers,
    get props() {
      return signals.toValues();
    },
  };
  return api;
}

/**
 * Helpers:
 */
function isHook(input: unknown): input is Hook {
  return !!input && Is.string((input as any).instance);
}

/**
 * Helpers:
 */
const wrangle = {
  signals(args: Args) {
    const api: t.RepoHookSignals = {
      repo: args.signals?.repo ?? Signal.create<t.CrdtRepo | undefined>(),
      syncEnabled: args.signals?.syncEnabled ?? Signal.create(D.syncEnabled),
      toValues() {
        const repo = api.repo.value;
        const syncEnabled = api.syncEnabled.value;
        return { repo, syncEnabled };
      },
    };
    return api;
  },
} as const;
