/**
 * Tools for working with Vite as a bundler and dev-harness within Deno.
 * @module
 */
export { pkg } from './pkg.ts';
export type * as t from './types.ts';

/**
 * Library
 */
export { ViteEntry } from './-entry/mod.ts';
export { ViteConfig } from './m.Vite.Config/mod.ts';
export { Vite } from './m.Vite/mod.ts';
