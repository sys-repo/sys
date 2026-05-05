/**
 * Cell operator CLI.
 */
export declare namespace CellCli {
  /** Runtime surface for Cell CLI flows. */
  export type Lib = {
    /** Run the Cell CLI from raw argv input. */
    run(input?: Input): Promise<Result>;
  };

  /** Raw CLI entrypoint input. */
  export type Input = {
    /** Raw argv tokens passed to the CLI entrypoint. */
    readonly argv?: readonly string[];
  };

  /** Typed argv shape produced by `Args.parse(...)` for the Cell CLI. */
  export type ParsedArgs = {
    /** Show CLI help and exit. */
    readonly help: boolean;
    /** Preview writes without changing the filesystem. */
    readonly dryRun: boolean;
    /** Include command-specific agent guidance with help. */
    readonly agent: boolean;
    /** Unknown flag tokens rejected by argument parsing. */
    readonly unknown: readonly string[];
    /** Positional argv tokens. */
    readonly _: readonly string[];
  };

  /** Result from a Cell CLI run. */
  export type Result = Help | Init.Result | Error;

  /** Help-only CLI run result. */
  export type Help = {
    /** Result discriminant. */
    readonly kind: 'help';
    /** Raw input passed to the CLI entrypoint. */
    readonly input: Input;
    /** Rendered help output. */
    readonly text: string;
  };

  /** Types for the `init` command. */
  export namespace Init {
    /** Successful Cell init result. */
    export type Result = {
      /** Result discriminant. */
      readonly kind: 'init';
      /** Raw input passed to the CLI entrypoint. */
      readonly input: Input;
      /** Rendered init output. */
      readonly text: string;
      /** Target folder. */
      readonly target: string;
      /** True when no files were written. */
      readonly dryRun: boolean;
      /** Template write operations. */
      readonly ops: readonly Op[];
    };

    /** Init write operation. */
    export type Op = {
      /** Operation kind. */
      readonly kind: 'create' | 'modify' | 'skip';
      /** Relative path. */
      readonly path: string;
      /** Optional skip reason. */
      readonly reason?: string;
      /** True when operation was previewed only. */
      readonly dryRun?: boolean;
    };
  }

  /** Unsupported invocation result. */
  export type Error = {
    /** Result discriminant. */
    readonly kind: 'error';
    /** Raw input passed to the CLI entrypoint. */
    readonly input: Input;
    /** Rendered help output. */
    readonly text: string;
    /** Suggested process exit code. */
    readonly code: number;
  };
}
