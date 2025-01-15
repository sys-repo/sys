/**
 * @module
 * Main CLI entry point to the module.
 * Immediate execution.
 */
import { Main } from './mod.ts';
await Main.entry(Deno.args);
Deno.exit(0);
