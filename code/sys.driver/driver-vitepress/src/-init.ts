/**
 * @module
 * Performs an scaffolding initialization of a VitePress module.
 */
import { Args } from './common.ts';
import { VitePress } from './m.VitePress/mod.ts';

const args = Args.parse<{ srcDir?: string }>(Deno.args);
const srcDir = args.srcDir;

await VitePress.init({ srcDir });
