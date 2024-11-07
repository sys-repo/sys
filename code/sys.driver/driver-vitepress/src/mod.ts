/**
 * @module
 * Tools for working with the "VitePress" documentation bundle compiler.
 * https://vitepress.dev/
 * 
 * The "VitePress" documentation [Markdown → HTML/JS] vite bundler
 * is in the category of a SSGs "static-site-generator."
 *
 * This lightweight process wrapper makes the Vite/VitePress
 * "live development" (HMR) and build/bundle commands reliably
 * invokeable programmatically in places like CI, or your own
 * extension module.

* @example
 * ```ts
 * import { pkg, VitePress } from '@sys/driver-vitepress';
 * ```
 */
export { pkg } from './pkg.ts';
export type * as t from './types.ts';
