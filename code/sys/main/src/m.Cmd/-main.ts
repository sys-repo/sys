/**
 * Main command entry point.
 * @module
 *
 * Pass (argv): "<command> --<params>"
 */
import { Main } from '../m.Cmd/mod.ts';
await Main.entry(Deno.args);
Deno.exit(0);
