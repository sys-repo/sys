/**
 * @module
 * Run on import:
 *
 *    Perform new file/folder scaffolding initialization
 *    of a standard VitePress project.
 *
 * https://vite.dev
 */
import { Args } from '../common.ts';
import { VitePress } from '../m.VitePress/mod.ts';

type A = { srcDir?: string };
const args = Args.parse<A>(Deno.args);
const { srcDir } = args;

await VitePress.Env.update({ srcDir });
Deno.exit(0);
