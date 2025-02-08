/**
 * @module
 * Tools for working with Vite as a bundler and dev-harness within Deno.
 */
export { pkg } from './pkg.ts';
export type * as t from './types.ts';

/**
 * Library
 */
export { ViteEntry } from './-entry/mod.ts';
export { ViteConfig } from './m.Vite.Config/mod.ts';
export { Plugin, workspacePlugin } from './m.Vite.Plugin/mod.ts';
export { Vite } from './m.Vite/mod.ts';
