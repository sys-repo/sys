import { DistServeScreenLayout } from './u.layout.ts';
import { DistServeScreenRuntime } from './u.runtime.ts';

/**
 * Stable terminal-owned Dist serve-screen facade.
 */
export const DistServeScreen = Object.freeze({
  toString: DistServeScreenLayout.toString,
  create: DistServeScreenRuntime.create,
});
