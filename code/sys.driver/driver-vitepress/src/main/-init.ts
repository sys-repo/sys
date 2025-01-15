/**
 * @module
 * Run on import:
 *
 *    Perform new system file/folder scaffolding initialization
 *    of a standard VitePress project.
 *
 * https://vitepress.dev
 *
 */
import { Cmd } from './mod.ts';
await Cmd.init(Deno.args);
Deno.exit(0);
