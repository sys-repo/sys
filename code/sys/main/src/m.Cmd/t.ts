import type { t } from './common.ts';

/**
 * Common system "Cmd" (Command Line) API.
 */
export type SysCmdLib = {
  /**
   * Main command entry point.
   * Pass: "<command> --<params>"
   *
   * @example
   * For example, placed in a task within a `deno.json` file:
   * ```ts
   * deno run -RWE jsr:@sys/main upgrade
   * ```
   */
  main(argv: string[]): Promise<void>;
};
