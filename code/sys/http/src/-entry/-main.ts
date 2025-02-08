/**
 * @module
 * Main CLI entry point to the module.
 * Immediate execution.
 */
import { Entry } from './mod.ts';
await Entry.entry();
Deno.exit(0);
