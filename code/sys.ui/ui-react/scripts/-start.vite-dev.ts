/**
 * Run in a child-process (hence the `-allow-run` requirement).
 */
import { Pkg, ViteCmd } from './common.ts';

const input = './src/-test/vite.sample-1/index.html';
const server = ViteCmd.dev({ Pkg, input });
await server.keyboard();
