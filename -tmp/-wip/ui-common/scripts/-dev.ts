import { Vite } from '@sys/driver-vite';
import { pkg } from '../src/pkg.ts';

const input = './src/-test/index.html';
const server = await Vite.dev({ pkg, input });
await server.listen();
