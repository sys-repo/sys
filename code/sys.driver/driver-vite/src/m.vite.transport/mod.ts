/**
 * @module
 * Deno-aware transport adapter for Vite module resolution and loading.
 *
 * Owns the runtime bridge for `jsr:`, `npm:`, URL-like specifiers, and
 * other Deno-native module identities inside the Vite/Rollup pipeline.
 */
import type { t } from './common.ts';

export const ViteTransport: t.ViteTransport.Lib = {};
