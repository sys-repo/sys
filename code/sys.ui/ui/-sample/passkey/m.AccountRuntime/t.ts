import type { t } from './common.ts';

/**
 * Host-owned passkey runtime; no renderer, persistence, or server authority.
 */
export declare namespace AccountRuntime {
  /** Each call creates an inactive runtime with no session credential. */
  export type Lib = { create(options: Options): Instance };

  /** Fixed issuing service and relying-party binding for one lifetime. */
  export type Options = {
    endpoint: t.StringUrl;
    namespace: string;
    rpId: string;
    policy: t.HttpCmd.Policy;
  };

  /** Explicit lifecycle and safe observations; raw command results are never exposed. */
  export type Instance = t.Disposable & {
    readonly state: State;
    /** Probe browser prerequisites and activate without a ceremony or anonymous inspection. */
    start(): void;
    /** Observe the retained session, if any; never resolve a prior uncertain mutation. */
    refresh(): Promise<void>;
    /** Explicit bearer-free observation; undefined on failure or cancellation. */
    readStats(signal: AbortSignal): Promise<t.Accounts.ServiceStats | undefined>;
    run(action: Action): Promise<Outcome>;
    /** Request cancellation without releasing an unsettled ceremony's exclusive slot. */
    cancel(): void;
    /** Forget local authority and retire in-flight work; start again on restoration. */
    depart(): void;
  };

  /** Live canonical readonly snapshots plus invalidations; no patches or mutable event payloads. */
  export type State = t.ImmutableReadonly<Snapshot> & { readonly changes$: t.Observable<void> };

  /** Local lifecycle, browser prerequisites, session facts, and attempts are independent. */
  export type Snapshot = {
    readonly lifecycle: 'inactive' | 'active' | 'departed' | 'disposed';
    readonly browser: { readonly kind: 'unchecked' } | t.WebAuthn.Availability;
    readonly session: Session;
    readonly operation: Operation;
    readonly last?: { readonly action: Action; readonly outcome: Outcome };
  };

  export type Session =
    | { readonly kind: 'unknown' | 'signed-out' }
    | { readonly kind: 'signed-in'; readonly value: t.Accounts.Session };

  export type Action = 'create-account' | 'sign-in' | 'add-passkey' | 'sign-out';
  export type Operation =
    | { readonly kind: 'idle' }
    /** Work from a departed lifetime still occupies the slot; its result cannot be adopted. */
    | { readonly kind: 'retiring' }
    | {
      readonly kind: 'pending';
      readonly action: Action | 'inspect';
      readonly phase: 'begin' | 'ceremony' | 'finish' | 'request';
    };

  /** Mutation outcome only; an accepted attempt need not leave a live local session. */
  export type Outcome =
    | { readonly kind: 'accepted' }
    | { readonly kind: 'indeterminate' }
    | { readonly kind: 'rejected'; readonly code: Rejection }
    | {
      readonly kind: 'not-submitted';
      readonly reason: 'busy' | 'invalid-input' | 'unavailable' | 'cancelled';
    };

  export type Rejection = t.Accounts.FinishRejection | 'credential-conflict' | 'no-session';
}
