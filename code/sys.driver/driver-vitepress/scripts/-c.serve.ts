import { HttpServer, Pkg } from 'jsr:@sys/std-s';
import { pkg } from '../src/pkg.ts';
import { TMP } from './u.ts';

const env = await TMP.env();
const dist = (await Pkg.Dist.load('./dist')).dist;
const hash = dist?.hash.digest ?? '';

/**
 * Define HTTP Web Server.
 */
const app = HttpServer.create({ pkg, hash });
app.use('/*', HttpServer.static(env.outDir));

/**
 * Start Server.
 */
const config = HttpServer.options(8080, pkg, hash);
Deno.serve(config, app.fetch);
