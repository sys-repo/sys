import { Fs, Is, type t } from '../common.ts';
import { serveFileWithEtag } from '../u.serveFile/u.serveFileWithEtag.ts';

type Input = Parameters<t.HttpServer.ServeStatic.Method>[0];

/**
 * Serve static files through the ETag-aware file path, preserving cache validation,
 * streaming, and Range/206 semantics as one transport contract.
 */
export const serveStatic: t.HttpServer.ServeStatic.Method = (input) =>
  serveStaticWith(input, Fs.stat);

/** Internal stat seam for proving refusal before filesystem lookup. */
export function serveStaticWith(
  input: Input,
  stat: t.Fs.GetStat,
): t.HttpServer.Hono.MiddlewareHandler {
  const options = wrangle.options(input);

  return async (c) => {
    const urlPath = decodeURIComponent(new URL(c.req.url).pathname);
    const root = Fs.Path.resolve(options.root ?? '.');
    const filePath = Fs.Path.resolve(Fs.Path.join(root, urlPath));

    // Lexical containment before lookup or fallback; not a symlink/no-follow guarantee.
    if (!Fs.Path.Is.within(root, filePath)) {
      return c.text('Forbidden', 403);
    }

    const notFound = async () => {
      // Custom 404 handler or default.
      return Is.func(options.onNotFound)
        ? await options.onNotFound(urlPath, c)
        : c.text('Not Found', 404);
    };

    try {
      const info = await stat(filePath);
      if (!info) return await notFound();

      // NB: If the target is a directory, serve the `index.html` file.
      const target = info.isDirectory ? Fs.Path.join(filePath, 'index.html') : filePath;
      const targetInfo = info.isDirectory ? await stat(target) : info;
      if (!targetInfo || !targetInfo.isFile) return await notFound();

      return await serveFileWithEtag({
        req: c.req.raw,
        path: target,
        stat: targetInfo,
      });
    } catch (err) {
      if (err instanceof Deno.errors.NotFound) return await notFound();
      throw err;
    }
  };
}

/**
 * Helpers:
 */
const wrangle = {
  /**
   * Normalise the caller’s input so we always work with an options object.
   *   - string  →  { root: string }
   *   - object  →  default root merged with caller options
   */
  options(input: Input): t.HttpServer.ServeStatic.Options<t.HttpServer.Hono.Env> {
    if (Is.string(input)) return { root: input };
    return { root: '.', ...input };
  },
} as const;
