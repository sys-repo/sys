import type { t } from './common.ts';

/**
 * Sample-local passkey diagnostics: supplied observations and action intent, not authentication IO.
 */
export declare namespace Passkey {
  export type Lib = { readonly UI: UI };

  /** Callable aggregate and independent diagnostic sections; no parent mount is required. */
  export type UI = t.FC<Props> & {
    readonly Actions: t.FC<ActionsProps>;
    readonly Status: t.FC<StatusProps>;
    readonly Context: t.FC<ContextProps>;
  };

  export type Props = Appearance & Callbacks & {
    snapshot: Snapshot;
    /** Defaults to the aggregate panel. */
    view?: View;
    /** Applies only to the aggregate panel. Omitted sections remain visible. */
    sections?: Sections;
  };

  /** Actions keeps the panel frame and activity title; Status and Context render standalone. */
  export type View = 'panel' | 'actions' | 'status' | 'context';

  /** Default order is Actions → Status → Context; use standalone sections for custom placement. */
  export type Sections = {
    readonly actions?: boolean;
    readonly status?: boolean;
    readonly context?: boolean;
  };

  /** Unframed controls and optional guidance. No request controls while authentication is uncertain. */
  export type ActionsProps =
    & Appearance
    & Callbacks
    & Pick<Snapshot, 'authentication' | 'operation' | 'context'>;

  /** Supplied authentication, operation, and result; owns detailed operation feedback when mounted. */
  export type StatusProps = Appearance & Pick<Snapshot, 'authentication' | 'operation' | 'result'>;

  /** Documentation keys explain concepts; only the sample's configured browser origin is navigable. */
  export type ContextProps = Appearance & Pick<Snapshot, 'context'>;

  /** Intent emission only; the renderer never performs authentication IO. */
  export type Callbacks = {
    onCreateAccount?: () => void;
    onSignIn?: () => void;
    onAddPasskey?: () => void;
    onSignOut?: () => void;
  };

  /** Explicit presentation inputs shared by the aggregate and independent sections. */
  export type Appearance = {
    debug?: boolean;
    theme?: t.CommonTheme;
    style?: t.Style.Input;
  };

  /** Canonical action button with an optional unavailable-action explanation. */
  export type ActionProps = {
    label: string;
    reason?: string;
    'aria-describedby'?: string;
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
      /**
       * Host-supplied display identity for the authenticated account in its security domain.
       * Does not imply WebAuthn user-handle or credential-ID semantics; rendered verbatim.
       */
      readonly principal: string;
      /** Account name supplied to the authenticator for display; not an identifier. */
      readonly label: string;
      /** Verifier-known non-negative integer; absent means unknown, not zero. */
      readonly credentialCount?: number;
    };

  /** Distinct intents; no implicit registration-to-session transition. */
  export type Action = 'create-account' | 'sign-in' | 'add-passkey' | 'sign-out';

  /** Supplied phase text describes observations, not a view-owned state machine. */
  export type Operation =
    | { readonly kind: 'idle' | 'checking' | 'retiring' }
    | { readonly kind: 'pending'; readonly action: Action; readonly phase: string };

  /** Safe display summary only: never raw challenges, tokens, assertions, or credential material. */
  export type Result =
    & { readonly action: Action; readonly summary: string }
    & (
      | { readonly kind: 'success' | 'failure' | 'indeterminate' }
      | Extract<t.AccountRuntime.Outcome, { kind: 'not-submitted' }>
    );

  /** Supplied prerequisite knowledge; an exposed browser API alone is not readiness. */
  export type Availability =
    | { readonly kind: 'available' }
    | { readonly kind: 'unknown' | 'unavailable'; readonly reason: string };

  /** Explicit configuration and upstream readiness; the renderer performs no capability probes. */
  export type Context = {
    readonly origin?: string;
    readonly rpId?: string;
    readonly rpName?: string;
    /** Includes secure-context and browser capability prerequisites for a ceremony. */
    readonly webAuthn: Availability;
    readonly verifier: Availability | { readonly kind: 'configured' };
    /** Host-authored Markdown shown with Actions, independent of session or operation state. */
    readonly registrationAdvisory?: string;
  };
}
