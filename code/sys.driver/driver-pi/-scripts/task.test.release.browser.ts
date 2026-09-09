import { runFrozenBrowser } from './u.test.release.ts';

if (Deno.args.length > 0) throw new TypeError('Frozen browser proof accepts no arguments.');
Deno.exitCode = await runFrozenBrowser();
