/**
 * @module
 * Canonical `deps.yaml` manifest helpers for ESM dependencies.
 */
import type { t } from './common.ts';
import { findImport } from './u.findImport.ts';
import { from } from './u.from.ts';
import { toEntry } from './u.toEntry.ts';
import { toYaml } from './u.toYaml.ts';

export const Deps: t.EsmDeps.Lib = {
  from,
  toYaml,
  toEntry,
  findImport,
};
