/**
 * @module
 * Main command entry point.
 *
 * Pass: "--cmd=<sub-command>"
 *      to specify which action to take, and then the paratmers
 *      that pertain to <sub-command> as defined in the <VitePressCmd> type.
 *
 */
import { VitepressEntry } from './mod.ts';
await VitepressEntry.main();
Deno.exit(0);
