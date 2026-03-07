import { type t } from '../common.ts';

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

  /** Lifecycle kill switch. */
  life?: t.Lifecycle;
};
