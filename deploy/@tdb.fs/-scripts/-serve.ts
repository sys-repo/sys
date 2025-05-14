import { pkg } from './common.ts';
import { HttpServer } from '@sys/http/server';
import { Pkg } from '@sys/fs';

const dir = 'dist';
const dist = (await Pkg.Dist.load(dir)).dist;
const hash = dist?.hash.digest ?? '';
const port = 8080;

const app = HttpServer.create({ pkg, hash, static: ['/*', dir] });
const options = HttpServer.options({ port, pkg, hash });

console.info();
Deno.serve(options, app.fetch);
await HttpServer.keyboard({ port, print: true });
