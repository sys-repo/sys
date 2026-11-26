import type { t } from './common.ts';

/**
 * Verifier-independent account contracts. Wire material stays private to the service/client binding;
 * Facts, Session, and ServiceStats are observations. See README.contract.md for commit and recovery obligations.
 */
export declare namespace Accounts {
  /** Strict admission of bounded, decoded JSON; undefined means invalid, never service rejection. */
  export type Lib = {
    readPayload<N extends Name>(name: N, input: unknown): Payload[N] | undefined;
    readResult<N extends Name>(name: N, input: unknown): Result[N] | undefined;
  };

  /** Request-local authority closes over handlers; never install a shared mutable current principal. */
  export type Service = (authority: Authority) => t.Cmd.Handler.Map<Name, Payload, Result>;

  /** Untrusted bearer supplied by the request binding, not an authenticated principal. */
  export type Authority = { credential?: string };

  /** Required service configuration: finite positive integer milliseconds, no implicit defaults. */
  export type Lifetimes = { challenge: t.Msecs; session: t.Msecs };

  /** Service-owned identity; not a credential ID, display label, or authority. */
  export type Principal = t.StringId;

  /** Service-confirmed account facts at the time of observation. */
  export type Facts = {
    readonly principal: Principal;
    /** Account name supplied to the authenticator for display; not an identifier. */
    readonly label: string;
    /** Non-negative safe integer; neither a credential inventory nor a transaction receipt. */
    readonly credentialCount: number;
  };

  /** Point-in-time facts, not a bearer capability. Expiry does not exclude earlier revocation. */
  export type Session = {
    readonly account: Facts;
    readonly expiresAt: t.UnixTimestamp;
  };

  /** Point-in-time totals for one service instance; no per-account data. */
  export type ServiceStats = {
    readonly accounts: number;
    readonly registeredPasskeys: number;
    readonly validSessions: number;
  };

  /** Secret-bearing result of verified creation/sign-in. Never publish this as observable state. */
  export type Grant = {
    readonly credential: string;
    readonly session: Session;
  };

  /** Private, purpose-bound, single-use ceremony reference; not a Cmd ID or an account selector. */
  export type Challenge<Options> = {
    readonly transaction: t.StringId;
    readonly expiresAt: t.UnixTimestamp;
    readonly options: Options;
  };

  /** Completion submits the original native JSON result; no caller-selected account is accepted. */
  export type Finish<Response> = { transaction: t.StringId; response: Response };

  /** A rejection promises no account/credential/session commit by this invocation, not a prior one. */
  export type Reply<Value, Code extends string> =
    | { readonly kind: 'accepted'; readonly value: Value }
    | { readonly kind: 'rejected'; readonly code: Code };

  /** Client knowledge, not a wire reply. Earlier begin/native work may exist even if finish was not sent. */
  export type Attempt<N extends Name> =
    | Result[N]
    | {
      readonly kind: 'not-submitted';
      readonly reason: 'invalid-input' | 'unavailable' | 'cancelled';
    }
    | { readonly kind: 'indeterminate' };

  /** Completion rejections are fixed codes, never verifier exceptions or reflected input. */
  export type FinishRejection =
    | 'invalid-request'
    | 'invalid-transaction'
    | 'verification-rejected'
    | 'state-changed'
    | 'capacity';

  /** Domain payloads for the existing unary Cmd grammar; bearer authority is out-of-band. */
  export type Payload = {
    readonly 'account.create.begin': Record<string, never>;
    readonly 'account.create.finish': Finish<Wire.Registration>;
    readonly 'session.signIn.begin': Record<string, never>;
    readonly 'session.signIn.finish': Finish<Wire.Authentication>;
    readonly 'passkey.add.begin': Record<string, never>;
    readonly 'passkey.add.finish': Finish<Wire.Registration>;
    readonly 'session.inspect': Record<string, never>;
    readonly 'session.revoke': Record<string, never>;
    readonly 'service.stats': Record<string, never>;
  };

  /** Accepted results have operation-specific effects; inspect/revoke concern only the supplied bearer. */
  export type Result = {
    readonly 'account.create.begin': Reply<
      Challenge<Wire.CreationOptions>,
      'invalid-request' | 'capacity'
    >;
    readonly 'account.create.finish': Reply<Grant, FinishRejection | 'credential-conflict'>;
    readonly 'session.signIn.begin': Reply<
      Challenge<Wire.RequestOptions>,
      'invalid-request' | 'capacity'
    >;
    readonly 'session.signIn.finish': Reply<Grant, FinishRejection>;
    readonly 'passkey.add.begin': Reply<
      Challenge<Wire.CreationOptions>,
      'invalid-request' | 'no-session' | 'capacity'
    >;
    readonly 'passkey.add.finish': Reply<
      Session,
      FinishRejection | 'no-session' | 'credential-conflict'
    >;
    readonly 'session.inspect': Reply<Session | null, 'invalid-request'>;
    readonly 'session.revoke': Reply<null, 'invalid-request'>;
    readonly 'service.stats': Reply<ServiceStats, 'invalid-request'>;
  };

  export type Name = keyof Payload;

  /**
   * WebAuthn Level 3 JSON dictionaries, not a private encoding or a verifier vendor's types.
   * Options use the native dictionaries with only the credProps extension requested by this contract.
   * Response declarations cover native toJSON() data; extension results remain uninterpreted/private.
   */
  export namespace Wire {
    export type CreationOptions = Omit<PublicKeyCredentialCreationOptionsJSON, 'extensions'> & {
      extensions?: Pick<AuthenticationExtensionsClientInputsJSON, 'credProps'>;
    };
    export type RequestOptions = Omit<PublicKeyCredentialRequestOptionsJSON, 'extensions'> & {
      extensions?: Pick<AuthenticationExtensionsClientInputsJSON, 'credProps'>;
    };

    /** RegistrationResponseJSON: https://www.w3.org/TR/webauthn-3/#dictdef-registrationresponsejson */
    export type Registration = {
      readonly id: Base64URLString;
      readonly rawId: Base64URLString;
      readonly type: 'public-key';
      readonly authenticatorAttachment?: string;
      readonly clientExtensionResults: Record<string, unknown>;
      readonly response: {
        readonly clientDataJSON: Base64URLString;
        readonly attestationObject: Base64URLString;
        readonly authenticatorData: Base64URLString;
        readonly transports: string[];
        readonly publicKeyAlgorithm: COSEAlgorithmIdentifier;
        readonly publicKey?: Base64URLString;
      };
    };

    /** AuthenticationResponseJSON: https://www.w3.org/TR/webauthn-3/#dictdef-authenticationresponsejson */
    export type Authentication = {
      readonly id: Base64URLString;
      readonly rawId: Base64URLString;
      readonly type: 'public-key';
      readonly authenticatorAttachment?: string;
      readonly clientExtensionResults: Record<string, unknown>;
      readonly response: {
        readonly clientDataJSON: Base64URLString;
        readonly authenticatorData: Base64URLString;
        readonly signature: Base64URLString;
        readonly userHandle?: Base64URLString;
      };
    };
  }
}
