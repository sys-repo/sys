/**
 * Sample [vite.config.ts] file
 * Notes:
 *
 *    The `ViteCmd.plugin()` configures the vite server to run
 *    within a child-process.
 *
 *    Example of starting up the Vite development server process:
 *
 *        import { Pkg } from './common.ts';
 *        import { ViteCmd } from '@sys/driver-vite';
 *
 *        const input = './path/to/entry/index.html';
 *        const server = await ViteCmd.dev({ Pkg, input });
 *        await server.keyboard();
 *
 */
import { ViteCmd } from '@sys/driver-vite';
import { defineConfig } from 'npm:vite';
import reactPlugin from 'npm:vite-plugin-react-swc';

export default defineConfig((_ctx) => {
  return {
    plugins: [reactPlugin(), ViteCmd.plugin()],
  };
});
