/**
 * Sample [vite.config.ts] file
 * Notes:
 *
 *    The `ViteProcess.plugin()` configures the vite server to run
 *    within a child-process.
 *
 *    Example of starting up the Vite development server process:
 *
 *        import { pkg } from './src/pkg.ts';
 *        import { ViteProcess } from '@sys/driver-vite';
 *
 *        const input = './path/to/entry/index.html';
 *        const server = await ViteProcess.dev({ pkg, input });
 *        await server.listen();
 *
 */

// deno-lint-ignore-file  no-unused-vars verbatim-module-syntax
import simple from './src/-test/vite.sample-config/config.simple.ts';
import custom from './src/-test/vite.sample-config/config.custom.ts';

// export default simple;
export default custom;
