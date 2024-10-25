import { Vite } from '@sys/driver-vite';
import { Pkg } from '../src/pkg.ts';

const input = './src/-test/index.html';
const server = await Vite.dev({ Pkg, input });
await server.listen();
