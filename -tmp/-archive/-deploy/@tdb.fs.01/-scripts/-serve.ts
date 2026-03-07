import { HttpServer } from '@sys/http/server';
import { pkg, Pkg } from './common.ts';

const dir = 'dist';
const dist = (await Pkg.Dist.load(dir)).dist;
const hash = dist?.hash.digest ?? '';
const port = 8080;

const app = HttpServer.create({ pkg, hash, static: ['/*', dir] });
const options = HttpServer.options({ port, pkg, hash });

console.info();
Deno.serve(options, app.fetch);
await HttpServer.keyboard({ port, print: true });
