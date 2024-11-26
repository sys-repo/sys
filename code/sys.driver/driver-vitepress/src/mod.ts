/**
 * @module
 * Tools for working with the "VitePress" documentation content compiler.
 * https://vitepress.dev
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
 * Initialize a folder as a VitePress project.
 *
 * To initialize a new content-transpiler project start by scaffolding out a runtime folder:
 * By default, the source content will be housed within `/docs` folder.  All
 * programmatic modules (with the exceptions of highlevel configuration .ts files)
 * are housed within `.hidden` folders and updatable via `deno trask upgrade`.
 *
 * Turn the current working directory into a content project.
 *
 * ```bash
 * deno run -A jsr:@sys/driver-vitepress/init
 * ```
 *
 * Once the project is initialized, use the three main commands `dev`, `build`
 * and `serve` via the `deno task` command.
 *
 * To run in development while authoring your content, run:
 *
 * ```bash
 * deno task dev
 * ```
 *
 * this will start the HMR (hot-module-reload) development server:
 *
 * ```bash
 *
 *    vitepress v<X.X.X>
 *
 *    ➜  Local:   http://localhost:1234/
 *    ➜  Network: use --host to expose
 *
 * ```
 *
 * Open the web-browser at http://localhost:1234/
 *
 * You can now move over to Obsidian (or any other markdown editor of choice)
 * to author and manage your content within the `/docs/` folder.
 *
 * The running HMR (hot-module-reload) the server will display the rendered result in your
 * browser, live updating on each edit you make.
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
 * See the `dist/dist.json` file for the SHA256 content hash and module
 * manifest of the versioned bundled.  This can be used as a
 *
 * These are published in HTTP headers:
 * ```
 *   pkg:          { name, version }
 *   pkg-digest:   digest:sha256:#
 * ```
 *
 *
 * @example
 * To `upgrade` your current local version of the compiler, run:
 *
 * ```bash
 * deno task upgrade
 * ```
 *
 * Migration
 *    Note: this does not touch the state of the "content" -
 *    only the compiler configuration and generated code assets.
 */
import { VitePress } from './m.VitePress/mod.ts';
export { VitePress };

export { pkg } from './pkg.ts';

/** Module types. */
export type * as t from './types.ts';

/** VitePress library. */
export default VitePress;
