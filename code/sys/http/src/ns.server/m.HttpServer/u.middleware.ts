import { type t, Err, Fs, Path } from './common.ts';

/**
 * Returns a middleware that:
 *
 *   • looks up the request path under `root`
 *   • if it’s an existing directory and the URL lacks a trailing "/" → 308 redirect to ".../"
 *
 * @param root   absolute or relative filesystem root you pass to serveStatic()
 * @param strip  optional mount-prefix (e.g. '/static/') to drop before stat-ing
 */
export function forceDirSlash(root: string, strip = '/'): t.HonoMiddlewareHandler {
  return async (c, next) => {
    const url = new URL(c.req.url);

    // Path already ends with '/' → nothing to do.
    if (url.pathname.endsWith('/')) return next();

    /**
     * Map URL to real file-system.
     * - Drop the mount-prefix, if any
     * - Remove leading '/' so join() honours `root`
     */
    let rel = url.pathname.startsWith(strip) ? url.pathname.slice(strip.length) : url.pathname;
    rel = rel.replace(/^\/+/, '');
    const path = Path.normalize(Path.join(root, rel));

    /**
     * Check for actual existence on file-system.
     */
    if (await Fs.Is.dir(path)) {
      // The directory exists → add a trailing slash.
      return c.redirect(`${url.pathname}/${url.search}`, 308);
    }

    // Fallthrough.
    return next();
  };
}
