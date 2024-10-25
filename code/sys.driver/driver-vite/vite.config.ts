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
import common from './vite.config.-common.ts';
import custom from './vite.config.-custom.ts';

// export default common;
export default custom;
