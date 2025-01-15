/**
 * @module
 * Main command entry point.
 *
 * Pass: "--cmd=<sub-command>"
 *      to specify which action to take, and then the paratmers
 *      that pertain to <sub-command> as defined in the <VitePressCmd> type.
 *
 */
import { Entry } from './mod.ts';
await Entry.main();
Deno.exit(0);
