/**
 * @module
 * Deno-aware transport adapter for Vite module resolution and loading.
 *
 * Owns the runtime bridge for `jsr:`, `npm:`, URL-like specifiers, and
 * other Deno-native module identities inside the Vite/Rollup pipeline.
 */
import type { t } from './common.ts';
import { denoPlugin } from './m.denoPlugin.ts';

/** Deno-native module transport helpers for Vite. */
export const ViteTransport: t.ViteTransport.Lib = {
  denoPlugin,
};
