import type { t } from './common.ts';

/**
 * Standardised "<Main Entry>" system beahviors.
 */
export type SysMainLib = {
  readonly Cmd: t.SysCmdLib;
  readonly entry: t.SysCmdLib['main'];
  readonly pkg: t.Pkg;
};

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
