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
    /** Positional argv tokens. */
    readonly _: readonly string[];
  };

  /** Result from a Cell CLI run. */
  export type Result = Help | Error;

  /** Help-only CLI run result. */
  export type Help = {
    /** Result discriminant. */
    readonly kind: 'help';
    /** Raw input passed to the CLI entrypoint. */
    readonly input: Input;
    /** Rendered help output. */
    readonly text: string;
  };

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
