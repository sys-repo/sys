import type { CliSpinner } from '@sys/cli/types';

import type { t } from './common.ts';
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

/**
 * Formatter surface for operator-facing deploy output.
 */
export type Lib = {
  /** Style spinner text for staged deploy progress. */
  spinnerText(text: string): string;

  /** Create a styled spinner for staged deploy progress. */
  spinner(text: string): CliSpinner.Instance;

  /** Listen to a pipeline handle and render operator-facing progress/output. */
  listen(deployment: p.Handle, hooks?: ListenHooks): t.Lifecycle;
};
