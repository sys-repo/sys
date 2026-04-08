import type { t } from './common.ts';

/**
 * Thin CLI transport surface for launching Pi.
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

    /**
     * Additional Pi CLI arguments.
     */
    readonly args?: readonly string[];

    /**
     * Optional environment variable overrides for the Pi child process.
     */
    readonly env?: Record<string, string>;
  };
}
