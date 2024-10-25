import { Pkg, Vite } from './common.ts';

const input = './src/-test/index.html';
const server = await Vite.dev({ Pkg, input });
await server.listen();
