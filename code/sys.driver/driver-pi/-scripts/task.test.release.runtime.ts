import { runReleaseRuntime } from './u.test.release.ts';

if (Deno.args.length > 0) throw new TypeError('Release runtime proof accepts no arguments.');
Deno.exitCode = await runReleaseRuntime();
