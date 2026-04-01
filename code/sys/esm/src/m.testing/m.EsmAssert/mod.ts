/**
 * @module
 * Assertion helpers for testing `@sys/esm` boundaries and contracts.
 */
import type { t } from './common.ts';
import { runtimeGraphBoundary } from './m.runtimeGraphBoundary.ts';
import { runtimeGraphOwnership } from './m.runtimeGraphOwnership.ts';

export const EsmAssert: t.EsmAssert.Lib = {
  runtimeGraphBoundary,
  runtimeGraphOwnership,
};
