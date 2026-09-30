import { Fs, type t } from '../common.ts';

/**
 * Returns a middleware that:
 *
 *   • looks up the request path under `root`
 *   • if it’s an existing directory and the URL lacks a trailing "/" → 308 redirect to ".../"
 *
 * @param root   absolute or relative filesystem root you pass to serveStatic()
 * @param strip  optional mount-prefix (e.g. '/static/') to drop before stat-ing
 */
export function forceDirSlash(root: string, strip = '/'): t.HttpServer.Hono.MiddlewareHandler {
  return forceDirSlashWith(root, strip, Fs.Is.dir);
}

/** Internal directory-lookup seam for proving refusal before filesystem effects. */
export function forceDirSlashWith(
  root: string,
  strip: string,
  isDir: typeof Fs.Is.dir,
): t.HttpServer.Hono.MiddlewareHandler {
  return async (c, next) => {
    const url = new URL(c.req.url);

    // Preserve the raw mount-prefix mapping, then decode its remainder exactly once.
    const mapped = url.pathname.startsWith(strip) ? url.pathname.slice(strip.length) : url.pathname;
    const rel = decodeURIComponent(mapped).replace(/^\/+/, '');
    const base = Fs.Path.resolve(root);
    const path = Fs.Path.resolve(Fs.Path.join(base, rel));

    // Lexical containment before lookup or redirect; not a symlink/no-follow guarantee.
    if (!Fs.Path.Is.within(base, path)) return c.text('Forbidden', 403);
    if (url.pathname.endsWith('/')) return next();

    if (await isDir(path)) {
      url.pathname = `${url.pathname}/`;
      // A leading '//' is an authority in a relative Location, not just a pathname.
      const location = url.pathname.startsWith('//') ? url.href : `${url.pathname}${url.search}`;
      return c.redirect(location, 308);
    }

    // Fallthrough.
    return next();
  };
}
