import type { t } from './common.ts';
import type * as s from './t.stage.ts';

/**
 * Request to deploy a staged artifact.
 */
export type Request = {
  /** Previously staged deploy artifact to deploy. */
  readonly stage: s.Result;

  /** Deno Deploy application name. */
  readonly app: string;

  /** Optional Deno Deploy organization name. */
  readonly org?: string;

  /** Optional auth token for Deno Deploy. */
  readonly token?: string;

  /** Optional Deno config path to pass through to the native CLI. */
  readonly config?: t.StringPath;

  /** Deploy directly to production when true. */
  readonly prod?: boolean;

  /** Allow node_modules to be uploaded when true. */
  readonly allowNodeModules?: boolean;

  /** Skip waiting for the remote build to complete when true. */
  readonly noWait?: boolean;

  /** Suppress native CLI output when true. */
  readonly silent?: boolean;
};

/**
 * Parsed deploy information emitted from native Deno Deploy output.
 */
export type Info = {
  /** Deploy URLs parsed as one coherent set. */
  readonly url?: {
    readonly revision: t.StringUrl;
    readonly preview: t.StringUrl;
  };
};

/**
 * Outcome of a deploy attempt.
 */
export type Result =
  /** Deploy completed successfully. */
  | ({ readonly ok: true } & NativeResult)
  /** Deploy failed with a native process result. */
  | ({ readonly ok: false } & NativeResult)
  /** Deploy failed before a process result was produced. */
  | { readonly ok: false; readonly error: unknown };

type NativeResult = {
  readonly code: number;
  readonly stdout: string;
  readonly stderr: string;
  readonly deploy?: Info;
};
