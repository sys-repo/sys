type O = Record<string, unknown>;

/** Parsed argument result with positional values in `._`. */
export type ParsedArgs<T extends O = O> = Args.Parse.Result<T>;

/** Command → aliases registry for CLI command normalization. */
export type ArgsAliasMap<T extends string> = Args.Alias.Map<T>;

/**
 * Command-line argument handling types.
 */
export declare namespace Args {
  /**
   * Public API for command-line argument handling.
   *
   * Exposes a minimist-style parser with bi-directional aliases,
   * predictable coercion, and stable positional handling.
   */
  export type Lib = {
    /** Parse command line arguments. */
    parse: Parse.Fn;

    /**
     * Convert a command → aliases map into an alias → command lookup.
     * Useful for normalizing `argv` where the first positional may be an alias.
     */
    toAliasLookup<T extends Record<string, Alias.List>>(map: T): Record<string, Extract<keyof T, string>>;

    /**
     * Normalize `argv` by rewriting the first positional token via an alias lookup.
     *
     * If `argv[0]` matches a key in `lookup`, it is replaced with its canonical command.
     * Otherwise `argv` is returned unchanged (as a new array).
     */
    normalizeCommand<TCmd extends string>(
      argv: readonly string[],
      lookup: Partial<Record<string, TCmd>>,
    ): string[];
  };

  /**
   * Argument parsing contracts.
   */
  export namespace Parse {
    /**
     * Parse command line arguments.
     *
     * @param argv    The argv vector to parse (defaults to `[]`). Use `Deno.args` in Deno CLIs.
     * @param options Parser options controlling booleans, strings, aliases, defaults, early-stop, and unknown handling.
     * @returns       A merged object of parsed flags plus `._` for positionals.
     */
    export type Fn = <T extends O = O>(argv?: string[], options?: Options) => Result<T>;

    /**
     * Shape of the parsed arguments returned by `parseArgs`.
     * - `_` holds all positional arguments (non-flag arguments).
     */
    export type Result<T extends O = O> = T & { _: string[] };

    /** Options for parsing command-line arguments. */
    export type Options = {
      /**
       * Argument names to process as boolean flags.
       * If passed on the command line, these will result in either `true` or `false`.
       */
      boolean?: string[];

      /**
       * Argument names to process as string values.
       * Their values will always be strings even if they look numeric.
       */
      string?: string[];

      /**
       * Default values for named arguments. If an argument is not found on the command line,
       * it will assume this default.
       */
      default?: Record<string, unknown>;

      /**
       * An object of aliases. For instance, `{ n: 'name' }` means `-n <value>` is the same as `--name <value>`.
       */
      alias?: Record<string, string | string[]>;

      /**
       * If `true`, stops parsing on the first non-option argument.
       * All subsequent arguments are collected in the `._` array.
       */
      stopEarly?: boolean;

      /**
       * A function that is invoked when encountering an unknown flag.
       * Return `false` to disallow the unknown flag.
       */
      unknown?: (arg: string) => boolean;
    };
  }

  /**
   * Command alias registry contracts.
   */
  export namespace Alias {
    /** Alias registry for CLI commands. */
    export type Map<T extends string> = Partial<Record<T, List>>;

    /** Non-empty alias list for a canonical command. */
    export type List = readonly [string, ...string[]];
  }
}
