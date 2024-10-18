import { HttpServer } from 'jsr:@sys/std-s';
import { Pkg } from './m.pkg.ts';

/**
 * Define HTTP Web Server.
 */
const app = HttpServer.create();
app.use('/*', HttpServer.static({ root: './dist' }));

/**
 * Start Server.
 */
const config = HttpServer.options(8080, Pkg);
Deno.serve(config, app.fetch);
