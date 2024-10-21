// deno-lint-ignore-file no-unreachable

/**
 * Sample [vite.config.ts] file
 * Notes:
 *
 *    The `ViteProcess.plugin()` configures the vite server to run
 *    within a child-process.
 *
 *    Example of starting up the Vite development server process:
 *
 *        import { Pkg } from './common.ts';
 *        import { ViteProcess } from '@sys/driver-vite';
 *
 *        const input = './path/to/entry/index.html';
 *        const server = await ViteProcess.dev({ Pkg, input });
 *        await server.keyboard();
 *
 */
import { workspacePlugin } from '@sys/driver-vite';
import reactPlugin from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';

import { c } from '@sys/std-s';
import { Style } from '@sys/ui-dom/style/react';

/**
 * SAMPLE: Custom plugin (no customization).
 */
export const customizedConfig = defineConfig(async (_ctx) => {
  const workspace = await workspacePlugin({
    /**
     * ƒ(🌳): Filter to apply to the workspace modules
     *       (default: nothing filtered → ie. the entire monorepo is available for `import`).
     */
    filter(e) {
      return true;

      if (e.subpath.startsWith('/client')) return true;
      if (e.pkg === '@sys/std') return true;
      return false;
    },

    /**
     * ƒ(🌳): Callback to mutate the generated Vite configuration before
     *        it is passed on to the next step in the bundle pipeline
     */
    mutate(e) {
      console.info(c.dim(`\n👋 (callback inside plugin)`));
      if (e.ws) {
        console.info(e.ws.toString({ pad: true }));
      }
    },
  });

  const react = reactPlugin(Style.plugin.emotion());
  return {
    plugins: [react, workspace],
  };
});

/**
 * SAMPLE: Simple default (no customization).
 */
export const simpleConfig = defineConfig((_ctx) => {
  const react = reactPlugin(Style.plugin.emotion());
  return { plugins: [react, workspacePlugin()] };
});

/**
 * Passed out as default export to → [Vite].
 */
export default customizedConfig;
