/**
 * @module
 * Tools for working with dependency/import sets in a Deno monorepo.
 *
 * Supports YAML-based dependency sets and conversion to `deno.json` and
 * `package.json` dependency surfaces.
 */
import type { DepsLib } from './t.ts';

import { findImport, from, toDep, toYaml } from './m.Deps.ts';
import { Fmt } from './m.Fmt.ts';
import { apply } from './u.apply.ts';
import { toJson } from './u.toJson.ts';

/** Deno dependency-set helper library. */
export const DenoDeps: DepsLib = {
  Fmt,
  apply,
  from,
  toJson,
  toYaml,
  toDep,
  findImport,
};
