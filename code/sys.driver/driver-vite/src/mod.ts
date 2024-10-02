/**
 * @module
 * Tools for working with Vite as a bundler and dev-harness within Deno.
 *
 * @example
 * ```ts
 * import { ViteConfig } from '@sys/driver-vite';
 * ```
 */
export { Pkg, c } from './common.ts';
export { ViteProcess } from './ViteProcess/mod.ts';
export { ViteConfig } from './ViteConfig/mod.ts';
