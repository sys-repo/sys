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
import reactPlugin from 'vite-plugin-react-swc';

/**
 * SAMPLE: Custom plugin (no customization).
 */
export const customizedConfig = defineConfig(async (_ctx) => {
  const workspace = await workspacePlugin({
    filter: (e) => e.subpath.startsWith('/client'),
    mutate(e) {
      /**
       * Non-typical use (hook for future extensibility).
       * NOTE: Optional configuration modifier callback.
       *       Use this to mutate the base configuration (safe).
       */
      const json = JSON.stringify(e).substring(0, 40);
      console.info(`\n🌳 (callback inside plugin) | e: ${json}...\n`);
      console.log('workspace', e.workspace.toAliasMap(), '\n');
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
  return {
    plugins: [reactPlugin(), workspacePlugin()],
  };
});

/**
 * Passed out as default export to → [Vite].
 */
export default customizedConfig;
