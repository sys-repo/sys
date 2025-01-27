/**
 * @module
 * Main CLI entry point to the module.
 * Immediate execution.
 */
import { ViteEntry } from './mod.ts';
await ViteEntry.main();
Deno.exit(0);
