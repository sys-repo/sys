import type { t } from './common.ts';

type PreviewStartedKey = 'origin' | 'verification' | 'signal' | 'finished' | 'close';

/**
 * Internal contracts for Deploy-owned verified local Dist preview sessions.
 */
export declare namespace DeployPreview {
  /** Sanitized reason why a preview session could not obtain or retain listener authority. */
  export type FailureReason = t.DistServer.StartFailureReason;

  /** Fresh endpoint-menu verification status without listener authority. */
  export type Status =
    | {
      readonly kind: 'verified';
      readonly evidence: t.Pkg.Dist.Local.Verify.Evidence;
    }
    | {
      readonly kind: 'unavailable';
      readonly reason: t.Pkg.Dist.Local.Verify.FailureKind;
    };

  /** One browser target derived from exact startup verification evidence. */
  export type Choice = {
    readonly kind: 'open';
    readonly path: t.StringUrlRoute;
    readonly url: t.StringUrl;
  };

  /** Closed interactive action set for one preview session. */
  export type Action = Choice | { readonly kind: 'reload' } | { readonly kind: 'back' };

  /** Inputs for one Deploy-owned preview session. */
  export type SessionArgs = {
    cwd: t.StringDir;
    dir: t.StringDir;
    name: string;
    port?: t.PortNumber;
    until?: t.UntilInput;
  };

  /** Terminal preview-session outcome. */
  export type SessionResult =
    | { readonly ok: true }
    | { readonly ok: false; readonly reason: FailureReason };

  /** Immutable minimum running authority owned by the preview session. */
  export type Started = Pick<t.DistServer.Started, PreviewStartedKey>;

  /** Exact listener-admission input owned by Deploy's preview policy. */
  export type StartInput = {
    dir: t.StringDir;
    limits: t.Pkg.Dist.Verify.Limits;
    hostname: '127.0.0.1';
    port: t.PortNumber;
    name: string;
    silent: true;
    keyboard: false;
    until: AbortSignal;
  };

  /** Minimal listener admission effect supplied to the preview session. */
  export type Start = (args: StartInput) => Promise<Started>;

  /** Presentation input derived from one exact started authority. */
  export type PromptInput = {
    name: string;
    origin: t.StringUrl;
    choices: readonly Choice[];
  };

  /** Terminal settlement of one owned preview prompt. */
  export type PromptOutcome =
    | { readonly kind: 'selected'; readonly value: Action }
    | { readonly kind: 'cancelled' };

  /** Running prompt authority whose disposal settles all prompt-owned work. */
  export type PromptStarted = {
    readonly finished: Promise<PromptOutcome>;
    dispose(reason?: unknown): Promise<void>;
  };

  /** Start one presentation prompt for the current listener generation. */
  export type Prompt = (input: PromptInput) => PromptStarted;

  /** Explicit effects supplied to the deterministic preview-session runner. */
  export type Dependencies = {
    start: Start;
    prompt: Prompt;
    open: (cwd: t.StringDir, url: t.StringUrl) => void;
  };
}
