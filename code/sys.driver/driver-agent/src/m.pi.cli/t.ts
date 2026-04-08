import type { t } from './common.ts';

/**
 * Thin CLI transport surface for launching Pi.
 *
 * References:
 * - https://pi.dev/
 * - https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent
 *
 * This local surface is a thin `@sys` launcher wrapper over the upstream Pi
 * coding-agent project.
 *
 * Provenance:
 * - Upstream Pi coding-agent license: MIT
 */
export declare namespace PiCli {
  export type Lib = {
    run(args?: RunArgs): Promise<t.ProcInheritOutput>;
  };

  export type RunArgs = {
    /**
     * Working directory passed to the Pi child process.
     * Defaults to the current host working directory.
     */
    readonly cwd?: t.StringDir;

    /** Additional Pi CLI arguments. */
    readonly args?: readonly string[];

    /** Optional environment variable overrides for the Pi child process. */
    readonly env?: Record<string, string>;

    /** Additional read-scope paths supplied by the caller. */
    readonly read?: readonly t.StringPath[];
  };
}
