/**
 * @module
 * Tools for working with the dependency/imports of a Deno monorepo.
 *
 * Place a single `imports.yaml` file in the root of the monorepo and
 * use this to auto-prepare `deno.json` and/or `package.json` files.
 */
import type { DepsLib } from './t.ts';

import { Fmt } from './m.Fmt.ts';
import { from } from './u.from.ts';
import { toDep } from './u.toDep.ts';
import { toJson } from './u.toJson.ts';
import { toYaml } from './u.toYaml.ts';

export const DenoDeps: DepsLib = {
  Fmt,
  from,
  toJson,
  toYaml,
  toDep,
};
