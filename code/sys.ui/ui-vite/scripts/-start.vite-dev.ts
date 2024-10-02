/**
 * Run in a child-process (hence the `-allow-run` requirement).
 */
import { Pkg, ViteCmd } from '../src/mod.ts';

const input = './src/-test/vite.sample-1/index.html';
const server = await ViteCmd.dev({ Pkg, input });
await server.keyboard();
