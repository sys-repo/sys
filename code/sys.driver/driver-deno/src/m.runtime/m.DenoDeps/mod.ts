/**
 * @module
 * Tools for working with dependency/import sets in a Deno monorepo.
 *
 * Supports YAML-based dependency sets and conversion to `deno.json` and
 * `package.json` dependency surfaces.
 */
import type { DepsLib } from './t.ts';

import { Fmt } from './m.Fmt.ts';
import { findImport } from './u.findImport.ts';
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
  findImport,
};
