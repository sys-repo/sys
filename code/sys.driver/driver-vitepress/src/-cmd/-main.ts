/**
 * @module
 * Run on import:
 *
 *    Performs an file/folder scaffolding initialization
 *    of a standard VitePress project.
 *
 * https://vite.dev
 */
import { main } from './-main.fn.ts';
await main(Deno.args);
Deno.exit(0);
