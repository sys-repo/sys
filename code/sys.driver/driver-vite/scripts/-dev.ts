/**
 * Run in a child-process (hence the `-allow-run` requirement).
 */
import { Pkg, Vite } from '@sys/driver-vite';

const input = './src/-test/vite.sample-2/index.html';
const server = await Vite.dev({ Pkg, input });
await server.keyboard();
