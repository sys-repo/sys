/**
 * Run in a child-process (hence the `-allow-run` requirement).
 */
import { Pkg, Vite } from './common.ts';

const input = './src/-test/index.html';
const server = await Vite.dev({ Pkg, input });
await server.keyboard();
