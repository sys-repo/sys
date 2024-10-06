/**
 * Run CI sequence.
 * NB: this is also invoked remotely within ".github/workflows".
 */
import { main as dry } from './Task.-dry.ts';
import { main as test } from './Task.-test.ts';

await dry();
await test();
await import('./cmd.info.ts');

Deno.exit(0);
