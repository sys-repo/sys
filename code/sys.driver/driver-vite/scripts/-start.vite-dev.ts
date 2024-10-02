/**
 * Run in a child-process (hence the `-allow-run` requirement).
 */
import { Pkg, ViteProcess } from '@sys/driver-vite';

const input = './src/-test/vite.sample-1/index.html';
const server = await ViteProcess.dev({ Pkg, input });
await server.keyboard();
