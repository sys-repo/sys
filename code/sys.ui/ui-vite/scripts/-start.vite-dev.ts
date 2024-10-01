/**
 * Run in a child-process.
 * Hence the -allow-run.
 */
import { Pkg, ViteCmd } from '../src/server/mod.ts';

const input = './src/-test/vite.sample-1/index.html';

// console.info();
// ViteCmd.Log.entry(Pkg, input);

const svc = ViteCmd.dev({ input, Pkg });
await svc.whenReady();
