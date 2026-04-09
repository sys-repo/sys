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
    main(input?: Input): Promise<Result>;
    run(args?: RunArgs): Promise<t.Process.InheritOutput>;
  };

  export type Input = {
    /** Raw argv tokens passed to the CLI wrapper entrypoint. */
    readonly argv?: readonly string[];

    /**
     * Working directory passed to the Pi child process.
     * Defaults to the current host working directory.
     */
    readonly cwd?: t.StringDir;

    /** Optional environment variable overrides for the Pi child process. */
    readonly env?: Record<string, string>;

    /** Additional read-scope paths supplied by the caller. */
    readonly read?: readonly t.StringPath[];

    /** Pi package spec to execute. Defaults to the canonical upstream package stem. */
    readonly pkg?: t.StringModuleSpecifier;
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

    /** Pi package spec to execute. Defaults to the canonical upstream package stem. */
    readonly pkg?: t.StringModuleSpecifier;
  };

  /** Typed wrapper argv shape produced from `Args.parse(...)`. */
  export type ParsedArgs = {
    readonly help?: boolean;
    readonly _: readonly string[];
  };

  export type Result = Help | Ran;

  export type Help = {
    readonly kind: 'help';
    readonly input: Input;
    readonly text: string;
  };

  export type Ran = {
    readonly kind: 'run';
    readonly input: Input;
    readonly parsed: ParsedArgs;
    readonly output: t.Process.InheritOutput;
  };
}
