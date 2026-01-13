/**
 * @module
 * Command-line argument parsing.
 *
 * - Aliases are **bi-directional**: an alias group behaves as one logical key.
 *   Setting a value on any member mirrors the value onto all members.
 *   Example: `{ h: "help", n: ["name", "nick"] }` means `h` ↔ `help`, `n` ↔ `name` ↔ `nick`.
 *
 * - Repeated sets (including via aliases) **accumulate** minimist-style:
 *   the first set yields a scalar; subsequent sets yield an array of all values, mirrored on aliases.
 *   Example: `--tag a --tag b -t c` (with `{ t: "tag" }`) → `tag: ["a","b","c"]` and `t: ["a","b","c"]`.
 *
 * - Booleans: keys listed in `options.boolean` coerce to `true|false`.
 *   - `--flag` → `true`
 *   - `--flag=false` → `false`
 *   - `--flag=true` → `true`
 *   - If a boolean flag is followed by a non-boolean token (e.g. `--flag 123`), it still resolves to `true`.
 *
 * - Strings: keys listed in `options.string` always produce a string (no numeric coercion).
 *
 * - Numbers: any non-string flag value that looks numeric is coerced to `number`.
 *
 * - Short flags (clustered): `-abc` is parsed as `-a -b -c`.
 *   The last letter in a cluster may take the next token as its value if it is not declared boolean.
 *   Numeric tails bind inline: `-n5` → `n: 5`.
 *
 * - `--` terminator: stops flag parsing; remaining tokens are pushed into `._` verbatim.
 *
 * - Positionals: non-flag tokens are collected in `._`.
 *   If `stopEarly: true`, then after the first positional, all remaining tokens are treated as positionals.
 *
 * - Defaults: `options.default` fills in missing keys after parsing (never overrides explicit inputs).
 *
 * - Unknown flags: if `options.unknown` is provided, it is called with the raw flag (`"--foo"` or `"-f"`).
 *   Return `false` to disallow (skip) that flag; return `true` to allow.
 *
 * @typeParam T - A typed map of known flags you want to merge into the result shape.
 *                The return type is `T & { _: string[] }`.
 *
 * @example Basic usage
 * ```ts
 * const res = Args.parse(["-v", "--port", "3000", "serve", "site"]);
 * // { v: true, port: 3000, _: ["serve", "site"] }
 * ```
 *
 * @example Aliases (bi-directional mirroring)
 * ```ts
 * const res = Args.parse(["-h", "--name=Phil"], {
 *   alias: { h: "help", n: ["name", "nick"] },
 * });
 * // res.help === true
 * // res.h === true
 * // res.name === "Phil"
 * // res.n === "Phil"
 * // res.nick === "Phil"
 * ```
 *
 * @example Repeated flags accumulate (including via aliases)
 * ```ts
 * const res = Args.parse(["--name=Phil", "-n", "PJ"], {
 *   alias: { n: ["name", "nick"] },
 * });
 * // res.name === ["Phil", "PJ"]
 * // res.n    === ["Phil", "PJ"]
 * // res.nick === ["Phil", "PJ"]
 * ```
 *
 * @example Booleans, strings, and numeric coercion
 * ```ts
 * const res = Args.parse(["--dry-run", "--port", "3000", "--id", "007"], {
 *   boolean: ["dry-run"],
 *   string: ["id"], // keep as string "007"
 * });
 * // res["dry-run"] === true
 * // res.port === 3000
 * // res.id === "007"
 * ```
 *
 * @example Short clusters, numeric tails, and `--`
 * ```ts
 * Args.parse(["-abc"]);       // { a: true, b: true, c: true, _: [] }
 * Args.parse(["-n5"]);        // { n: 5, _: [] }
 * Args.parse(["--name", "x", "--", "--kept", "-z"]);
 * // { name: "x", _: ["--kept", "-z"] }
 * ```
 */

import type { t } from './common.ts';
import { normalizeCommand } from './u.normalizeCommand.ts';
import { parseArgs } from './u.parse.ts';
import { toAliasLookup } from './u.toAliasLookup.ts';

export { parseArgs };

/**
 * Command-line argument parsing.
 */
export const Args: t.ArgsLib = {
  parse: parseArgs,
  normalizeCommand,
  toAliasLookup,
};
