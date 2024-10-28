/**
 * Run in a child-process (hence the `-allow-run` requirement).
 */
import { Vite } from '@sys/driver-vite';
import { Pkg } from '../src/pkg.ts';

const input = './src/-test/vite.sample-2/index.html';
const server = await Vite.dev({ pkg, input });
await server.listen();
