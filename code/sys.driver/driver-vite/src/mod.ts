/**
 * @module
 * Tools for working with Vite as a bundler and dev-harness within Deno.
 *
 * @example
 * Within the `vite.config.ts` in the root of the module:
 * ```ts
 * import { ViteProcess } from '@sys/driver-vite';
 * import { defineConfig } from 'vite';
 * import reactPlugin from 'vite-plugin-react-swc';
 *
 * export default defineConfig((_ctx) => {
 *   return { plugins: [reactPlugin(), ViteProcess.workspacePlugin()] };
 * });
 * ```
 */
export { Pkg, c } from './common.ts';
export { ViteProcess } from './ViteProcess/mod.ts';
export { ViteConfig } from './ViteConfig/mod.ts';
