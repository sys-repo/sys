import type { t } from './common.ts';

/**
 * Sample-local passkey diagnostics: supplied observations and action intent, not authentication IO.
 */
export declare namespace Passkey {
  export type Lib = { readonly UI: t.FC<Props> };

  /** Pure view input. Callbacks request work; only a new snapshot changes displayed facts. */
  export type Props = {
    snapshot: Snapshot;
    onCreateAccount?: () => void;
    onSignIn?: () => void;
    onAddPasskey?: () => void;
    onSignOut?: () => void;
    debug?: boolean;
    theme?: t.CommonTheme;
    style?: t.Style.Input;
  };

  /** Canonical action button with an optional unavailable-action explanation. */
  export type ActionProps = {
    label: string;
    reason?: string;
    pending: boolean;
    onClick?: () => void;
    theme?: t.CommonTheme;
  };

  /** Supplied operation status with a presentation-only spinner. */
  export type OperationProps = {
    operation: Operation;
    theme?: t.CommonTheme;
  };

  /** Latest supplied result, or the standard empty value. */
  export type ResultProps = { result?: Result };

  /** Sample-local warning text for unavailable actions or uncertain observations. */
  export type WarningProps = {
    message: string;
    ariaLabel?: string;
    theme?: t.CommonTheme;
    style?: t.Style.Input;
  };

  /** Independent session, operation, result, and context observations. */
  export type Snapshot = {
    readonly authentication: Authentication;
    readonly operation: Operation;
    readonly context: Context;
    readonly result?: Result;
  };

  /** Only a confirmed session carries an authenticated principal. */
  export type Authentication =
    | { readonly kind: 'checking' }
    | { readonly kind: 'unknown'; readonly summary: string }
    | { readonly kind: 'signed-out' }
    | {
      readonly kind: 'signed-in';
      readonly principal: string;
      /** Verifier-known non-negative integer; absent means unknown, not zero. */
      readonly credentialCount?: number;
    };

  /** Distinct intents; no implicit registration-to-session transition. */
  export type Action = 'create-account' | 'sign-in' | 'add-passkey' | 'sign-out';

  /** Supplied phase text describes observations, not a view-owned state machine. */
  export type Operation =
    | { readonly kind: 'idle' }
    | { readonly kind: 'pending'; readonly action: Action; readonly phase: string };

  /** Safe display summary only: never raw challenges, tokens, assertions, or credential material. */
  export type Result = {
    readonly action: Action;
    readonly kind: 'success' | 'failure';
    readonly summary: string;
  };

  /** Supplied prerequisite knowledge; an exposed browser API alone is not readiness. */
  export type Availability =
    | { readonly kind: 'available' }
    | { readonly kind: 'unknown' | 'unavailable'; readonly reason: string };

  /** Explicit configuration and upstream readiness; the renderer performs no capability probes. */
  export type Context = {
    readonly origin?: string;
    readonly rpId?: string;
    /** Includes secure-context and browser capability prerequisites for a ceremony. */
    readonly webAuthn: Availability;
    readonly verifier: Availability;
  };
}
