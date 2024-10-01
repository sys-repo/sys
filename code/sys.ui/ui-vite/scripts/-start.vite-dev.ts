/**
 * Run in a child-process.
 * Hence the -allow-run.
 */
import { Pkg, ViteCmd } from '../src/server/mod.ts';

const input = './src/-test/vite.sample-1/index.html';
const svc = ViteCmd.dev({ Pkg, input });
await svc.keyboard();
