/**
 * @module
 * Main command entry point.
 *
 * Pass (argv): "<command> --<params>"
 */
import { Cmd } from '../m.Cmd/mod.ts';
await Cmd.main(Deno.args);
Deno.exit(0);
