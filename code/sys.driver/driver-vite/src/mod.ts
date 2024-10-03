/**
 * @module
 * Tools for working with Vite as a bundler and dev-harness within Deno.
 *
 * @example
 * Within the `vite.config.ts` in the root of the module:
 * ```ts
 * import reactPlugin from 'vite-plugin-react-swc';
 * import { defineConfig } from 'vite';
 * import { workspacePlugin } from '@sys/driver-vite';
 *
 * export default defineConfig((_ctx) => {
 *   const workspace = workspacePlugin();
 *   return { plugins: [reactPlugin(), workspace] };
 * });
 * ```
 */
export { Pkg, c } from './common.ts';
export { Vite } from './m.Vite/mod.ts';
export { ViteConfig } from './m.ViteConfig/mod.ts';
export { ViteProcess, workspacePlugin } from './m.ViteProcess/mod.ts';
