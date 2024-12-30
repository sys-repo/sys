import { Hash, HttpServer } from '@sys/std-s';
import { pkg } from '../src/pkg.ts';

/**
 * @example
 * Calculate a hash of the runtime directory,
 * to pass into the HTTP server.
 *   →  displayed on startup console output.
 *   →  returns the hash as {Pkg-Digest} http header.
 */
const dirname = import.meta.dirname ?? '';
const hx = (await Hash.Dir.compute(dirname)).hash;
const hash = hx.digest;

/**
 * @example
 * Start the HTTP web-server.
 *
 * Notes:
 *  →  Serves with headers:
 *       "Pkg": "<name>@<version>"
 *       "Pkg-Digest": "<hash>"
 */
const port = 8080;
const app = HttpServer.create({ pkg, hash });
const options = HttpServer.options({ port, pkg, hash });
Deno.serve(options, app.fetch);

/**
 * Routes.
 */
app.get('/', (c) => c.json({ msg: '👋' }));

/**
 * Listen to keyboard.
 */
await HttpServer.keyboard({ port, print: true });
