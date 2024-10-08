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
import { defineConfig } from 'vite';
import reactPlugin from '@vitejs/plugin-react-swc';

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
      if (e.subpath.startsWith('/client')) return true;
      if (e.pkg === '@sys/std') return true;
      return false;
    },

    /**
     * ƒ(🌳): Callback to mutate the generated Vite configuration before
     *        it is passed on to the next step in the bundle pipeline
     */
    mutate(e) {
      console.info(`\n👋 (callback inside plugin)`);
      if (e.ws) {
        console.info(e.ws.toString({ pad: true }));
      }
    },
  });

  return {
    plugins: [reactPlugin(), workspace],
  };
});

/**
 * SAMPLE: Simple default (no customization).
 */
export const simpleConfig = defineConfig((_ctx) => {
  return { plugins: [reactPlugin(), workspacePlugin()] };
});

/**
 * Passed out as default export to → [Vite].
 */
export default customizedConfig;
