import type { t } from './common.ts';
import type { CrdtRepo, CrdtRepoEvents, CrdtRepoMethods, CrdtRepoProps } from './t.ts';

/**
 * Compile-time drift guards:
 */

// 1. Repo composition stays methods & props & lifecycle
type _Guard_Repo_Composition = t.Type.Assert<
  t.Type.Equal<CrdtRepo, CrdtRepoMethods & CrdtRepoProps & t.LifecycleAsync>
>;

// 2. Events surface remains stable (primary $, prop$, ready$, network$)
type _Guard_RepoEvents = t.Type.Assert<
  t.Type.Equal<
    CrdtRepoEvents,
    t.Lifecycle & {
      readonly $: t.Observable<t.CrdtRepoEvent>;
      readonly prop$: t.Observable<t.CrdtRepoPropChangeEvent['payload']>;
      readonly ready$: t.Observable<boolean>;
      readonly network$: t.Observable<t.CrdtNetworkChangeEvent>;
    }
  >
>;

// 3. Method signatures (contract test)
type _Guard_RepoMethods = t.Type.Assert<
  t.Type.Equal<
    CrdtRepoMethods,
    {
      whenReady(): Promise<t.CrdtRepo>;
      create<T extends Record<string, unknown>>(initial: T | (() => T)): t.CrdtRef<T>;
      get<T extends Record<string, unknown>>(
        id: t.StringId,
        options?: { timeout?: t.Msecs },
      ): Promise<{ readonly doc?: t.CrdtRef<T>; readonly error?: t.CrdtRepoError }>;
      delete(id: t.StringId | t.Crdt.Ref): Promise<void>;
      events(dispose?: t.UntilInput): t.CrdtRepoEvents;
    }
  >
>;

/**
 * Force instantiation so TS actually checks:
 */
type _ = _Guard_Repo_Composition & _Guard_RepoEvents & _Guard_RepoMethods;
