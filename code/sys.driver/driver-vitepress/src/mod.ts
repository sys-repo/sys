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
 * Getting started.
 *
 * To initialize a new VitePress project start with a scaffolding module named `tmpl.ts`:
 *
 * ```bash
 * deno run -A jsr:@sys/driver-vitepress/init
 * ```
 * To specify a different location for your source content (`.md` files)
 * pass the `--srcDir=<path>` argument.
 *
 * This will layout the baseline required files for the VitePress engine.
 *
 * Once the project is initialized, use the three main commands `dev`, `build`
 * and `serve` via the `deno task`.
 *
 * To run the HMR (hot-module-reload) development server while authoring:
 *
 * ```bash
 * deno task dev
 *
 * Terminal Output:
 *
 *    vitepress v<x.x.x>
 *
 *    ➜  Local:   http://localhost:1234/
 *    ➜  Network: use --host to expose
 * ```
 *
 * Open the web-browser at http://localhost:1234/ (or hit the `o` key to open your browser
 * at that address).
 *
 * Then move over to Obsidian (or any other markdown editor of choice) to author your content,
 * seeing the resulting output live updating in your browser.
 *
 * ---
 *
 * Once ready to release, `build` the content into a package/bundle to deploy to the cloud.
 * You can test it locally using the local `serve` command:
 *
 * ```bash
 * deno task build
 * deno task serve
 * ```
 */
import { VitePress } from './m.VitePress/mod.ts';
export { VitePress };

export { pkg } from './pkg.ts';

/** Module types. */
export type * as t from './types.ts';

/** VitePress library. */
export default VitePress;
