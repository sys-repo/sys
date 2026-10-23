import type { t } from './common.ts';

/**
 * Service-worker deployment contracts.
 */
export declare namespace HttpServiceWorker {
  /**
   * Canonical service-worker deployment helpers.
   */
  export type Lib = {
    /** Classify one deployment context under the fail-closed worker policy. */
    readonly admit: Admission.Method;
    /** Register a worker only after admitting the actual browser location. */
    readonly register: Register.Method;
    /** Conditionally install inert migration behavior in the actual worker global. */
    readonly tombstone: Tombstone.Method;
  };

  /**
   * Service-worker deployment admission.
   */
  export namespace Admission {
    /** URL-like deployment context inspected by the canonical policy. */
    export type Input = string | t.UrlLike;

    /** Classify a deployment context without consulting mutable browser or process state. */
    export type Method = (input?: Input) => Result;

    /** Complete fail-closed deployment classification. */
    export type Result = Admitted | Refused;

    /**
     * Any result that does not permit service-worker authority.
     * Refusal prevents a grant; it does not by itself authorize destructive migration effects.
     */
    export type Refused = Denied | Unsupported | Failed;

    /**
     * HTTPS context whose URL hostname is not syntactically loopback.
     * This does not attest public reachability, DNS resolution, provider trust, or release provenance.
     */
    export type Admitted = {
      readonly kind: 'admitted';
      readonly deployment: 'https-non-loopback';
      readonly origin: t.StringUrl;
    };

    /** Recognized HTTP(S) deployment that policy denies. */
    export type Denied = {
      readonly kind: 'denied';
      readonly reason: 'loopback' | 'non-https';
      readonly origin: t.StringUrl;
    };

    /** Context whose protocol or runtime shape cannot host admitted deployment. */
    export type Unsupported = {
      readonly kind: 'unsupported';
      readonly reason: 'unknown-context' | 'unsupported-protocol';
    };

    /** Context that could not be parsed as an absolute deployment URL. */
    export type Failed = {
      readonly kind: 'failed';
      readonly reason: 'invalid-url';
    };
  }

  /**
   * Application-side registration observations.
   */
  export namespace Register {
    /** Inputs for browser-location-bound service-worker registration. */
    export type Args = {
      /** Worker script URL passed to the browser registration substrate. */
      scriptUrl: string | t.UrlLike;
      /** Bounded browser registration options, snapshotted before registration. */
      options?: Options;
    };

    /** Registration options consciously admitted by this package. */
    export type Options = {
      readonly scope?: string;
      readonly type?: 'classic' | 'module';
      readonly updateViaCache?: 'all' | 'imports' | 'none';
    };

    /** Register only when the actual browser location is canonically admitted. */
    export type Method = (args: Args) => Promise<Result>;

    /** Registration observation or the exact non-admitted deployment result. */
    export type Result =
      | Registered
      | Unsupported
      | Failed
      | Admission.Refused;

    /** Browser-reported successful registration. */
    export type Registered = {
      readonly kind: 'registered';
      readonly admission: Admission.Admitted;
      readonly scope: string;
      /**
       * Point-in-time browser observation only. `absent` cannot attest that no prior
       * controller existed outside a freshly isolated browser profile.
       */
      readonly controller: 'present' | 'absent' | 'unknown';
    };

    /** Admitted deployment without a service-worker registration substrate. */
    export type Unsupported = {
      readonly kind: 'unsupported';
      readonly reason: 'service-worker-unavailable';
      readonly admission: Admission.Admitted;
    };

    /** Sanitized registration failure with no raw browser error. */
    export type Failed = {
      readonly kind: 'failed';
      readonly reason: InputFailureReason | OutcomeFailureReason;
      readonly admission: Admission.Admitted;
    };

    /** Failure established before this helper invoked browser registration. */
    export type InputFailureReason =
      | 'invalid-script-url'
      | 'invalid-registration-options'
      | 'registration-substrate-failure';

    /**
     * Failure after invoking browser registration.
     * These observations never prove that the browser made no persistent registration side effect.
     */
    export type OutcomeFailureReason = 'registration-rejected' | 'registration-unverified';
  }

  /**
   * Policy-bound denied-context migration tombstone.
   */
  export namespace Tombstone {
    /** Inputs for conditionally installing inert migration behavior. */
    export type Args = {
      /**
       * Trusted artifact package identity; its exact name is cleanup authority across this origin.
       * Registration scope is not a separate cache owner.
       */
      pkg: t.Pkg;
    };

    /**
     * Classify the actual service-worker global and install migration behavior only when positively
     * denied. Calling this outside a classifiable service-worker context has no migration effects.
     */
    export type Method = (args: Args) => Result;

    /** Complete deployment classification and tombstone setup observation. */
    export type Result = Admission.Admitted | Installed | Indeterminate | SetupFailed;

    /**
     * Lifecycle handlers were installed for a positively denied deployment.
     * This does not attest activation, cleanup, unregister, or absence of a prior controller.
     */
    export type Installed = {
      readonly kind: 'installed';
      readonly admission: Admission.Denied;
    };

    /**
     * Exact admission observations that are not positive enough to authorize migration effects.
     */
    export type Indeterminate = Admission.Unsupported | Admission.Failed;

    /**
     * Complete lifecycle behavior could not be installed on a positively denied worker substrate.
     * This sanitized observation does not attest absence of a partially installed listener.
     */
    export type SetupFailed = {
      readonly kind: 'failed';
      readonly reason: 'setup-failure';
      readonly admission: Admission.Denied;
    };
  }
}
