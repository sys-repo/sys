import { Pkg } from 'jsr:@sys/fs';
import { HttpServer } from 'jsr:@sys/http/server';
import { pkg } from './pkg.ts';

const dist = (await Pkg.Dist.load('./dist')).dist;
const hash = dist?.hash.digest ?? '';

/**
 * Define HTTP Web Server.
 */
const app = HttpServer.create({ pkg, hash });
app.use('/*', HttpServer.static('./dist'));

/**
 * Start Server.
 */
const config = HttpServer.options(8080, pkg, hash);
Deno.serve(config, app.fetch);
