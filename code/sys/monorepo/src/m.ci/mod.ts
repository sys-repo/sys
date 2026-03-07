/**
 * @module
 * Continuous-integration module surface for monorepo tooling.
 */
import type { t } from './common.ts';
import { Build } from './m.Build/mod.ts';
import { Jsr } from './m.Jsr/mod.ts';
import { Test } from './m.Test/mod.ts';

export const MonorepoCi: t.MonorepoCi.Lib = {
  Jsr,
  Build,
  Test,
};
