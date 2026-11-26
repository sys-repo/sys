import type { t } from './common.ts';

/**
 * Client runtime for one account service. The host owns its lifetime; the service owns authority.
 */
export declare namespace AccountRuntime {
  export type Lib = {
    /** Create an inactive runtime with no session credential. */
    create(options: CreateOptions): Instance;
  };

  /** Fixed issuing service and relying-party binding for one lifetime. */
  export type CreateOptions = {
    endpoint: t.StringUrl;
    namespace: string;
    rpId: string;
    policy: t.HttpCmd.Policy;
  };

  /**
   * The host uses this instance to run account actions and observe their outcomes.
   * The session bearer and raw ceremony responses stay private to the runtime.
   */
  export type Instance = t.Disposable & {
    readonly state: State;
    readonly info: Info;
    /** Activate or restore locally: check browser support without sending a request. */
    start(): void;
    /** Inspect a retained session when idle; this cannot confirm an earlier mutation. */
    refresh(): Promise<void>;
    /** Attempt one account action; a busy runtime does not queue it. */
    run(action: Action): Promise<Action.Outcome>;
    /** Request cancellation of an action or inspection; its slot stays occupied until settlement. */
    cancel(): void;
    /** Forget the bearer without revoking the remote session. Call `start()` on restoration. */
    depart(): void;
  };

  /** Explicit, bearer-free reads from the bound account service. */
  export type Info = {
    /** Read service totals; `undefined` means no observation, not zero. */
    readCounts(signal?: AbortSignal): Promise<t.Accounts.ServiceStats | undefined>;
  };

  /** Read `current` on attachment and whenever `changed$` fires; notifications do not replay. */
  export type State = t.ImmutableReadonly<State.Snapshot> & {
    readonly changed$: t.Observable<void>;
  };

  /**
   * Types exposed by the runtime state.
   */
  export namespace State {
    /** Local observations: `session` describes current access; `last` describes an action. */
    export type Snapshot = {
      readonly lifecycle: 'inactive' | 'active' | 'departed' | 'disposed';
      readonly browser: { readonly kind: 'unchecked' } | t.WebAuthn.Availability;
      readonly session: Session;
      readonly operation: Operation;
      readonly last?: { readonly action: Action; readonly outcome: Action.Outcome };
    };
  }

  /** `unknown` does not confirm sign-out; `signed-out` does not imply remote revocation. */
  export type Session =
    | { readonly kind: 'unknown' | 'signed-out' }
    | { readonly kind: 'signed-in'; readonly value: t.Accounts.Session };

  export type Operation =
    | { readonly kind: 'idle' }
    // Work from before departure still holds the slot, but cannot restore the session.
    | { readonly kind: 'retiring' }
    | {
      readonly kind: 'pending';
      readonly action: Action | 'inspect';
      readonly phase: 'begin' | 'ceremony' | 'finish' | 'request';
    };

  export type Action = 'create-account' | 'sign-in' | 'add-passkey' | 'sign-out';

  /**
   * Results of one account action, distinct from current session state.
   */
  export namespace Action {
    export type Rejection = t.Accounts.FinishRejection | 'credential-conflict' | 'no-session';

    /**
     * An accepted action need not leave a live local session.
     * An indeterminate mutation may have committed; do not retry it automatically.
     */
    export type Outcome =
      | { readonly kind: 'accepted' }
      | { readonly kind: 'indeterminate' }
      | { readonly kind: 'rejected'; readonly code: Rejection }
      | {
        readonly kind: 'not-submitted';
        readonly reason: 'busy' | 'invalid-input' | 'unavailable' | 'cancelled';
      };
  }
}
