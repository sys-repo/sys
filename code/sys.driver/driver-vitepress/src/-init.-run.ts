/**
 * @module
 * Run on import:
 *
 *    Perform new file/folder scaffolding initialization
 *    of a standard VitePress project.
 *
 * https://vite.dev
 */
import { Args } from './common.ts';
import { VitePress } from './m.VitePress/mod.ts';

const args = Args.parse<{ srcDir?: string }>(Deno.args);
const srcDir = args.srcDir;

await VitePress.init({ srcDir });
