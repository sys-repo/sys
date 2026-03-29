import type { CliSpinner } from '@sys/cli/types';

import type { t } from './common.ts';
import type * as d from './t.deploy.ts';
import type * as p from './t.pipeline.ts';

/**
 * Formatter surface for operator-facing deploy output.
 */
export type ListenCtx = {
  readonly deployment: p.Handle;
  readonly step: Extract<p.Step, { readonly kind: 'stage:start' }>;
};

/**
 * Optional listener hooks for light output customization around the canonical formatter flow.
 */
export type ListenHooks = {
  /** Extra lines to print after deploy config and before the first spinner state. */
  readonly afterConfig?: (ctx: ListenCtx) => readonly string[] | void;
};

/** Arguments rendered by the public deploy-config formatter. */
export type DeployConfigArgs = {
  readonly app: string;
  readonly org?: string;
  readonly token?: string;
  readonly sourceDir?: string;
  readonly stagedDir?: string;
  readonly title?: string;
};

/** Successful deploy result rendered by the public deploy-result formatter. */
export type DeployResult = Extract<d.Result, { readonly ok: true }>;

/** Arguments rendered by the public deploy-failure formatter. */
export type DeployFailureArgs = {
  readonly phase: string;
  readonly error: unknown;
  readonly at?: string;
};

/** Public deploy-formatting helpers reused by decomposed callers. */
export type DeployLib = {
  /** Render a canonical Deno Deploy configuration summary. */
  config(args: DeployConfigArgs): readonly string[];

  /** Render a canonical successful Deno Deploy result block. */
  result(result: DeployResult, title?: string, elapsed?: t.Msecs): readonly string[];

  /** Render a canonical decomposed deploy failure block. */
  failure(args: DeployFailureArgs): readonly string[];
};

/** Public spinner-formatting helpers reused by callers. */
export type SpinnerLib = {
  /** Style spinner text for staged deploy progress. */
  text(text: string): string;

  /** Create a styled spinner for staged deploy progress. */
  create(text: string): CliSpinner.Instance;
};

/**
 * Formatter surface for operator-facing deploy output.
 */
export type Lib = {
  /** Public spinner-formatting helpers. */
  readonly Spinner: SpinnerLib;

  /** Decomposed deploy-formatting helpers for external callers. */
  readonly Deploy: DeployLib;

  /** Listen to a pipeline handle and render operator-facing progress/output. */
  listen(deployment: p.Handle, hooks?: ListenHooks): t.Lifecycle;
};
