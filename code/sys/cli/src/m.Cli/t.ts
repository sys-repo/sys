import type { t } from './common.ts';

/**
 * Exports:
 */
export type * from './t.lib.ts';
export type * from './t/t.format.ts';
export type * from './t/t.keyboard.ts';
export type * from './t/t.prompt.ts';
export type * from './t/t.spinner.ts';
export type * from './t/t.table.ts';

/** Response from `Cli.copyToClipboard` method. */
export type CliCopyResult = { ok: true } | { ok: false; error: Error; tried: string[] };

/** Options for a long-running CLI process that exits on Ctrl-C. */
export type CliKeepAliveOptions = {
  /**
   * Optional callback invoked once the lifecycle is created and before
   * the function starts waiting. Use this to start servers, subscribe to
   * streams, etc.
   */
  readonly onStart?: (life: t.Lifecycle) => void | Promise<void>;

  /**
   * Process exit code used when Ctrl-C is received.
   * Defaults to 0 (success).
   */
  readonly exitCode?: number;
};
