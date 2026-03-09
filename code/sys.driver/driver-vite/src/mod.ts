/**
 * @module
 * Deno-first tools for configuring and running Vite in local workspaces and
 * external package consumers.
 *
 * Includes configuration helpers, workspace/import-map integration, and the
 * transport adapter that bridges Deno-native module resolution into Vite.
 *
 * This keeps Vite behavior consistent across monorepos and external JSR
 * consumers without call-site-specific import hacks.
 *
 * It does not redefine Vite. The goal is to preserve normal Vite behavior
 * while making the Deno boundary stable and resolvable.
 *
 */
export { pkg } from './pkg.ts';

/** Type library (barrel file). */
export type * as t from './types.ts';

/**
 * Library
 */
export { ViteEntry } from './-entry/mod.ts';
export { ViteConfig } from './m.vite.config/mod.ts';
export { ViteTransport } from './m.vite.transport/mod.ts';
export { Vite } from './m.vite/mod.ts';
