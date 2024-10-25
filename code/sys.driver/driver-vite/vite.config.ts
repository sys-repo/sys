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
 *        await server.listen();
 *
 */

// deno-lint-ignore-file  no-unused-vars verbatim-module-syntax
import plain from './vite.config.-plain.ts';
import common from './vite.config.-common.ts';

// export default plain;
export default common;
