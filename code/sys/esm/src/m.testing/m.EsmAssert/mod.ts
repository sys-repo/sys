/**
 * @module
 * Assertion helpers for testing `@sys/esm` boundaries and contracts.
 */
import type { t } from './common.ts';
import { runtimeGraphBoundary } from './m.runtimeGraphBoundary.ts';

export const EsmAssert: t.EsmAssert.Lib = {
  runtimeGraphBoundary,
};
