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
 * To initialize a new VitePress project start with a scaffolding module named `tmpl.ts`:
 *
 * ```ts
 * import { VitePress } from 'jsr:@sys/driver-vitepress';
 * await VitePress.init();
 * ```
 *
 * This will layout the baseline files. Run the command:
 *
 * ```bash
 * deno run -A tmpl.ts
 * rm tmpl.ts
 * ```
 *
 * @example
 * Once the project is initialized, use the three main commands via the `deno task`
 *
 * To run the HMR dev server:
 *
 * ```bash
 * Terminal Output:
 *
 *    vitepress v<X.X.X>
 *
 *    ➜  Local:   http://localhost:1234/
 *    ➜  Network: use --host to expose
 * ```
 *
 * Then move over to Obsidian (or other markdown editor of choice) to author your content.
 *
 * Once ready to release, `build` the content into a Pkg bundle to deploy to the cloud.
 * You can test it locally using the local `serve` command:
 *
 * ```bash
 * deno task build
 * deno task serve
 * ```
 *
 */
export { pkg } from './pkg.ts';
export type * as t from './types.ts';

export { VitePress } from './m.VitePress/mod.ts';
