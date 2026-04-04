/**
 * @module
 * Deno-facing dependency projection and apply helpers.
 *
 * Consumes canonical manifest data from `@sys/esm/deps` and projects it onto
 * Deno runtime surfaces such as `deno.json`, import maps, and `package.json`.
 */
import type { DepsLib } from './t.ts';

import { findImport, from, toDep, toYaml } from './m.Deps.ts';
import { Fmt } from './m.Fmt.ts';
import { applyDeno } from './u.apply.ts';
import { applyFiles } from './u.applyFiles.ts';
import { applyPackage } from './u.applyPackage.ts';
import { applyYaml } from './u.applyYaml.ts';
import { toJson } from './u.toJson.ts';
import { verifyDeno } from './u.verifyDeno.ts';

/** Deno dependency projection/apply helper library. */
export const DenoDeps: DepsLib = {
  Fmt,
  applyDeno,
  applyFiles,
  applyPackage,
  applyYaml,
  from,
  toJson,
  toYaml,
  toDep,
  findImport,
  verifyDeno,
};
