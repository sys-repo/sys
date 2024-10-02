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
import { ViteProcess } from '@sys/driver-vite';
import { defineConfig } from 'npm:vite';
import reactPlugin from 'npm:vite-plugin-react-swc';

export default defineConfig((_ctx) => {
  const config = ViteProcess.plugin((_e) => {
    /**
     * NOTE: Optional configuration modifier callback.
     *       Use this to mutate the base configuration (safe).
     */
  });

  /**
   * Default plugin (no customization).
   */
  // const config = ViteProcess.plugin();

  return {
    plugins: [reactPlugin(), config],
  };
});
