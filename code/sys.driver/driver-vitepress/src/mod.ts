/**
 * @module
 * Tools for working with the "VitePress" documentation content compiler.
 * https://vitepress.dev/
 *
 * The "VitePress" documentation [Markdown → HTML/JS] vite bundler
 * is in the category of a SSGs "static-site-generator."
 *
 * This lightweight process wrapper makes the Vite/VitePress
 * "live development" (HMR) and build/bundle commands reliably
 * invokeable programmatically in places like CI, or your own
 * extension module.
 *
 * @example
 * To run the VitePress process for your Obsidian vault, place a `main.ts` file
 * within the folder where your vault(s) are stored and paste the following code
 * into that file:
 *
 * ```ts
 * import { VitePress } from '@sys/driver-vitepress';
 *
 * const server = await VitePress.dev();
 * await server.listen();
 * ```
 *
 * Then start the development server:
 * ```ts
 * $ deno run -A main.ts
 * ```
 */
export { pkg } from './pkg.ts';
export type * as t from './types.ts';

export { VitePress } from './m.VitePress/mod.ts';
