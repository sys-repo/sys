/**
 * Main CLI entry point to the module.
 * Immediate execution.
 * @module
 */
import { ViteEntry } from './mod.ts';
await ViteEntry.main();
Deno.exit(0);
