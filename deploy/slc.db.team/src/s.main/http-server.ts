import { Pkg } from 'jsr:@sys/fs';
import { HttpServer } from 'jsr:@sys/http/server';
import { pkg } from './pkg.ts';

const dist = (await Pkg.Dist.load('./dist')).dist;
const hash = dist?.hash.digest ?? '';

/**
 * Define HTTP Web Server.
 */
const app = HttpServer.create({ pkg, hash });

/**
 * Docs
 */
app.get('/docs', HttpServer.static({ root: './dist.docs', path: '/index.html' }));
app.use(
  '/docs/*',
  HttpServer.static({
    root: './dist.docs',
    rewriteRequestPath: (path) => path.replace(/^\/docs/, ''),
  }),
);

// Serve static files from /dist for all other paths.
app.use('/*', HttpServer.static({ root: './dist' }));

/**
 * Start Server.
 */
const config = HttpServer.options(8080, pkg, hash);
Deno.serve(config, app.fetch);

/**
 * Sample static server middleware.
 */

// const staticMiddleware = (rootDir: string) => {
//   return async (c: Context, next: Next) => {
//     const url = new URL(c.req.url);
//     let filepath = decodeURIComponent(url.pathname);
//
//     // Prevent directory traversal attacks
//     if (filepath.includes('..')) {
//       return c.text('Forbidden', 403);
//     }
//
//     // Map URL path to filesystem path
//     filepath = `${rootDir}${filepath}`;
//
//     try {
//       let fileInfo = await Deno.stat(filepath);
//
//       // If it's a directory, try to serve index.html
//       if (fileInfo.isDirectory) {
//         filepath = `${filepath}/index.html`;
//         fileInfo = await Deno.stat(filepath); // Re-stat the index.html file
//       }
//
//       // Read the file content
//       const file = await Deno.readFile(filepath);
//
//       // Determine the content type
//       const contentType = lookup(filepath) || 'application/octet-stream';
//
//       // Return the file content
//       return c.body(file, 200, {
//         'Content-Type': contentType,
//       });
//     } catch (e) {
//       if (e instanceof Deno.errors.NotFound) {
//         // File not found, proceed to the next middleware or route
//         await next();
//       } else {
//         // Other errors (e.g., permission issues)
//         return c.text('Internal Server Error', 500);
//       }
//     }
//   };
// };
