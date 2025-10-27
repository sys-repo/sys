import { type t } from './common.ts';

type O = Record<string, unknown>;

/**
 * Command-line argument parsing.
 *
 * Canonical behavior (derived from the parser in `u.parseArgs.ts`):
 *
 * - Aliases: `alias` is bi-directional. Setting a value on one alias mirrors it to all linked keys.
 *   Example: `{ h: "help", n: ["name", "nick"] }` means `-h` ↔ `--help`, `-n` ↔ `--name` ↔ `--nick`.
 *
 * - Booleans: Flags listed in `options.boolean` coerce to `true|false`.
 *   - `--flag` → `true`
 *   - `--flag=false` → `false`
 *   - `--flag=true` → `true`
 *   - If a boolean flag is given a non-boolean value token (e.g. `--flag 123`), it resolves to `true`.
 *
 * - Strings: Flags in `options.string` always produce a string value (no numeric coercion).
 *
 * - Numbers: Any non-string flag value that looks numeric is coerced to `number`.
 *   Example: `--port 3000` → `port: 3000` unless `"port"` is listed in `options.string`.
 *
 * - Short flags (clustered): `-abc` is parsed as `-a -b -c`. The last letter in a cluster may take a value
 *   from the next token if it is not declared boolean. Numeric tails bind inline:
 *   - `-n5` → `n: 5` (numeric tail)
 *   - `-n 5` → `n: 5`
 *   - `-abc` → `a: true, b: true, c: true` (unless `c` takes a value from the next token)
 *
 * - `--` terminator: Stops flag parsing. Remaining tokens are pushed into `._` (positionals) verbatim.
 *
 * - Positionals: Non-flag tokens are collected in `._`. If `stopEarly: true`, then after the first positional,
 *   all remaining tokens are treated as positionals.
 *
 * - Defaults: `options.default` fills in missing keys after parsing (does not override explicit inputs).
 *
 * - Unknown flags: If `options.unknown` is provided, it is called with the raw flag (`"--foo"` or `"-f"`).
 *   Return `false` to disallow (skip) that flag. Return `true` (or omit the function) to allow.
 *
 * - Repeated flags: If a key is set more than once (including via aliases), values accumulate into an array,
 *   following minimist-style behavior. Example: `--tag a --tag b -t c` → `tag: ["a","b","c"]` (and mirrored on aliases).
 *
 * @typeParam T - A typed map of known flags you want to merge into the result shape. The return type is `T & { _: string[] }`.
 *
 * @example Basic usage
 * ```ts
 * import { Args } from "@sys/std/m.Args"; // hypothetical import
 *
 * const res = Args.parse(["-v", "--port", "3000", "serve", "site"]);
 * // res:
 * // { v: true, port: 3000, _: ["serve", "site"] }
 * ```
 *
 * @example Aliases (bi-directional)
 * ```ts
 * const res = Args.parse(["-h", "--name=Phil", "-n", "PJ"], {
 *   alias: { h: "help", n: ["name", "nick"] },
 * });
 * // res.help === true
 * // res.h === true
 * // res.name === "PJ"
 * // res.n === "PJ"
 * // res.nick === "PJ"
 * ```
 *
 * @example Booleans, strings, and numeric coercion
 * ```ts
 * const res = Args.parse(["--dry-run", "--port", "3000", "--id", "007"], {
 *   boolean: ["dry-run"],
 *   string: ["id"], // keep as string "007"
 * });
 * // res["dry-run"] === true
 * // res.port === 3000        // numeric
 * // res.id === "007"         // preserved as string
 * ```
 *
 * @example Short clusters and numeric tails
 * ```ts
 * const a = Args.parse(["-abc"]);
 * // a: { a: true, b: true, c: true, _: [] }
 *
 * const b = Args.parse(["-n5"]); // inline numeric tail
 * // b: { n: 5, _: [] }
 *
 * const c = Args.parse(["-n", "5"]);
 * // c: { n: 5, _: [] }
 * ```
 *
 * @example `--` terminator and `stopEarly`
 * ```ts
 * const one = Args.parse(["--name", "x", "--", "--kept", "-z"]);
 * // one: { name: "x", _: ["--kept", "-z"] }
 *
 * const two = Args.parse(["--flag", "pos1", "--also", "x", "pos2"], { stopEarly: true });
 * // two: { flag: true, _: ["pos1", "--also", "x", "pos2"] }
 * ```
 *
 * @example Defaults and repeated flags
 * ```ts
 * const res = Args.parse(["--tag", "a", "--tag", "b"], {
 *   default: { retries: 3 },
 *   alias: { t: "tag" },
 * });
 * // res.tag → ["a","b"]
 * // res.t   → ["a","b"]   // mirrors onto alias
 * // res.retries === 3     // default applied if not present on CLI
 * ```
 *
 * @example Rejecting unknown flags
 * ```ts
 * const res = Args.parse(["--good", "1", "--bad", "x"], {
 *   unknown: (raw) => {
 *     // allow only "--good" and its short aliases
 *     return raw === "--good" || raw === "-g";
 *   },
 * });
 * // res: { good: 1 } // "--bad" is skipped
 * ```
 */
export type ArgsLib = {
  /**
   * Parse command line arguments.
   *
   * @param argv    The argv vector to parse (defaults to `[]`). Use `Deno.args` in Deno CLIs.
   * @param options Parser options controlling booleans, strings, aliases, defaults, early-stop, and unknown handling.
   * @returns       A merged object of parsed flags plus `._` for positionals.
   */
  parse<T extends O = O>(argv?: string[], options?: t.ParseArgsOptions): ParsedArgs<T>;
};

/**
 * Parse command line arguments.
 */
export type ParseArgs = ArgsLib['parse'];

/**
 * Shape of the parsed arguments returned by `parseArgs`
 * - `_` holds all positional arguments (non-flag arguments).
 */
export type ParsedArgs<T extends O = O> = T & { _: string[] };

/**
 * Options for parsing command-line arguments
 */
export type ParseArgsOptions = {
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
