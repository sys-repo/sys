/**
 * @module
 * Continuous-integration module surface for monorepo tooling.
 */
import type { t } from './common.ts';
import { Jsr } from './m.Jsr/mod.ts';

export const MonorepoCi: t.MonorepoCi.Lib = { Jsr };
