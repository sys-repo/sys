import { Pkg, HttpServer } from './mod.ts';

/**
 * HTTP Web-Server
 */
const app = HttpServer.create();
Deno.serve(HttpServer.options(8000, Pkg), app.fetch);

/**
 * Routes
 */
app.get('/', (c) => c.json({ msg: '👋' }));
