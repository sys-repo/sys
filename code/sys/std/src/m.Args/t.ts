type O = Record<string, any>;

/**
 * Tools for parsing and interpretting "arguments" (parameter strings).
 * @example
 *
 * ```ts
 * const args = Args.parse(Deno.args);
 *
 * const a = Args.parse("-a beep -b boop");
 * const b = Args.parse("-x 3 -y 4 -n5 -abc --beep=boop foo bar baz");
 * ```
 */
export type ArgsLib = {
  /**
   * Parse command line arguments.
   */
  parse<T extends O = O>(argv: string[]): ParsedArgs<T>;
};

/**
 * Parsed arguments.
 */
export type ParsedArgs<T extends O = O> = T & { _: string[] };
