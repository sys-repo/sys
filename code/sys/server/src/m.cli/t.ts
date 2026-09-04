/**
 * Server package help/DSL CLI.
 */
export declare namespace ServerCli {
  /** Library surface for Server CLI help flows. */
  export type Lib = {
    /** Run the Server help CLI from raw argv input. */
    run(input?: Input): Promise<Result>;
  };

  /** Raw CLI entrypoint input. */
  export type Input = {
    /** Raw argv tokens passed to the CLI entrypoint. */
    readonly argv?: readonly string[];
  };

  /** Typed argv shape produced by `Args.parse(...)` for the Server help CLI. */
  export type ParsedArgs = {
    /** Show help and exit. */
    readonly help: boolean;
    /** Raw `--format` flag value, accepted only by `dsl`. */
    readonly format?: string | boolean | readonly (string | boolean)[];
    /** Unknown flag tokens rejected by argument parsing. */
    readonly unknown: readonly string[];
    /** Positional argv tokens. */
    readonly _: readonly string[];
  };

  /** Types for the `dsl` command. */
  export namespace Dsl {
    /** Supported DSL chapter output formats. */
    export type Format = 'human' | 'skill';
  }

  /** Result from a Server help CLI run. */
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
