/**
 * @module
 * Tools for working with Vite as a bundler and dev-harness within Deno.
 *
 * @example
 * Within the `vite.config.ts` in the root of the module:
 *
 * ```ts
 * import { Vite } from '@sys/driver-vite';
 * import { defineConfig } from 'vite';
 * import reactPlugin from '@vitejs/plugin-react-swc';
 *
 * export default defineConfig(() => {
 *   const workspace = Vite.Plugin.workspace();
 *   return { plugins: [reactPlugin(), workspace] };
 * });
 * ```
 *
 * Optionally, you can filter the workspace modules that are exposed
 * to the Vite bundle:
 *
 * ```ts
 * export default defineConfig(() => {
 *   const workspace = Vite.Plugin.workspace({ filter: (e) => e.subpath.startsWith('/client') });
 *   return { plugins: [reactPlugin(), workspace] };
 * });
 * ```
 *
 * Along with the option to manulate the configuration further after the initial
 * baseline settings have initialized, using the `mutate` plugin callback.
 */
export { pkg } from './pkg.ts';
export type * as t from './types.ts';

export { c } from './common.ts';
export { ViteConfig } from './m.Vite.Config/mod.ts';
export { Plugin, workspacePlugin } from './m.Vite.Plugin/mod.ts';
export { Vite } from './m.Vite/mod.ts';
