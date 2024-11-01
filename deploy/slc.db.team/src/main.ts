import { HttpServer, Pkg } from 'jsr:@sys/std-s';
import { pkg } from './pkg.ts';

const dist = (await Pkg.Dist.load('./dist')).dist;
const hash = dist?.hash.digest ?? '';

/**
 * TODO 🐷 header: pkg-hash: <digest>
 */

/**
 * Define HTTP Web Server.
 */
const app = HttpServer.create({ pkg, hash });
app.use('/*', HttpServer.static({ root: './dist' }));

/**
 * Start Server.
 */
const config = HttpServer.options(8080, pkg, hash);
Deno.serve(config, app.fetch);
