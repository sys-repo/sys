import { HttpServer } from '@sys/std-s';
import { pkg } from '../src/pkg.ts';

/**
 * HTTP Web-Server
 */
const app = HttpServer.create({ pkg });
Deno.serve(HttpServer.options(8000, pkg), app.fetch);

/**
 * Routes
 */
app.get('/', (c) => c.json({ msg: '👋' }));
