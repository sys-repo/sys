/**
 * @module
 * Canonical `deps.yaml` manifest helpers for ESM dependencies.
 */
import type { t } from './common.ts';
import { applyDeno } from './u.apply.ts';
import { applyFiles } from './u.applyFiles.ts';
import { applyPackage } from './u.applyPackage.ts';
import { applyYaml } from './u.applyYaml.ts';
import { findImport } from './u.findImport.ts';
import { from } from './u.from.ts';
import { toEntry } from './u.toEntry.ts';
import { toYaml } from './u.toYaml.ts';

export const Deps: t.EsmDeps.Lib = {
  applyDeno,
  applyFiles,
  applyPackage,
  applyYaml,
  from,
  toYaml,
  toEntry,
  findImport,
};
