import { HttpServer } from 'jsr:@sys/std-s';
import { pkg } from './pkg.ts';

/**
 * Define HTTP Web Server.
 */
const app = HttpServer.create({ pkg });
app.use('/*', HttpServer.static({ root: './dist' }));

/**
 * Start Server.
 */
const config = HttpServer.options(8080, pkg);
Deno.serve(config, app.fetch);
