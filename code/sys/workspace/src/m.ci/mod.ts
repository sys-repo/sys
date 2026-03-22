/**
 * @module
 * Continuous-integration helpers for multi-package repositories.
 */
import type { t } from './common.ts';
import { Build } from './m.Build/mod.ts';
import { Jsr } from './m.Jsr/mod.ts';
import { Test } from './m.Test/mod.ts';

/** Continuous-integration helper library. */
export const WorkspaceCi: t.WorkspaceCi.Lib = {
  Jsr,
  Build,
  Test,
};
