/**
 * @module
 * Tools for working with the dependency/imports of a Deno monorepo.
 *
 * Place a single `imports.yaml` file in the root of the monorepo and
 * use this to auto-prepare `deno.json` and/or `package.json` files.
 */
import { type t } from './common.ts';
import { Fmt } from './m.Fmt.ts';
import { from } from './u.from.ts';
import { toJson } from './u.toJson.ts';

export const DenoDeps: t.DepsLib = {
  Fmt,
  from,
  toJson: (kind, deps) => toJson(kind, deps),
};
