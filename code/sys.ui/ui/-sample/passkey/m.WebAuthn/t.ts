/**
 * Browser WebAuthn mechanism, independent of UI and authentication authority.
 */
export declare namespace WebAuthn {
  /**
   * Native ceremonies only; callers own policy, verification, session state, and concurrency.
   * Ceremonies reject with NotSupportedError when unavailable, TypeError for an unexpected native
   * result kind, or the original platform exception. Nothing is logged, persisted, or retried.
   */
  export type Lib = {
    /** Inspect secure-context/API exposure without opening a ceremony. */
    availability(): Availability;

    /** Create a credential for verification; null is not a diagnosed cancellation or success. */
    create(options: CreateOptions): Promise<Registration | null>;

    /** Acquire an assertion for verification; the browser result does not establish a session. */
    get(options: GetOptions): Promise<Assertion | null>;
  };

  /** Native options, including cancellation and mediation, with public-key creation required. */
  export type CreateOptions = Omit<CredentialCreationOptions, 'publicKey'> & {
    publicKey: PublicKeyCredentialCreationOptions;
  };

  /** Native options, including cancellation and mediation, with public-key acquisition required. */
  export type GetOptions = Omit<CredentialRequestOptions, 'publicKey'> & {
    publicKey: PublicKeyCredentialRequestOptions;
  };

  /** Original browser object; keep raw credential material out of diagnostics and local storage. */
  export type Registration = PublicKeyCredential & {
    readonly response: AuthenticatorAttestationResponse;
  };

  /** Original browser object; send only to the responsible verifier over its defined transport. */
  export type Assertion = PublicKeyCredential & {
    readonly response: AuthenticatorAssertionResponse;
  };

  /** API exposure is necessary, not sufficient, for a ceremony to succeed. */
  export type Availability =
    | { readonly kind: 'available' }
    | { readonly kind: 'unavailable'; readonly reason: 'insecure-context' | 'unsupported' };
}
