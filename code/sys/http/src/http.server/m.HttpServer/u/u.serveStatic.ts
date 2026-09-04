import { Fs, Path, type t } from '../common.ts';
import { serveFileWithEtag } from './u.serveFileWithEtag.ts';

type Input = Parameters<t.HttpServer.ServeStatic.Method>[0];

/**
 * Serve static files through the ETag-aware file path, preserving cache validation,
 * streaming, and Range/206 semantics as one transport contract.
 */
export const serveStatic: t.HttpServer.ServeStatic.Method = (input: Input) => {
  const options = wrangle.options(input);

  return async (c) => {
    // Avoid path-traversal (stepping up out of the server folder).
    const urlPath = decodeURIComponent(new URL(c.req.url).pathname);
    const fullPath = Path.join(options.root ?? '', urlPath);
    const filePath = Path.normalize(fullPath);

    // Ensure the result is still under {options.root}.
    if (!filePath.startsWith(Path.normalize(options.root ?? '.'))) {
      return c.text('Forbidden', 403);
    }

    const notFound = async () => {
      // Custom 404 handler or default.
      return typeof options.onNotFound === 'function'
        ? await options.onNotFound(urlPath, c)
        : c.text('Not Found', 404);
    };

    try {
      const info = await Fs.stat(filePath);
      if (!info) return await notFound();

      // NB: If the target is a directory, serve the `index.html` file.
      const target = info.isDirectory ? Path.join(filePath, 'index.html') : filePath;
      const targetInfo = info.isDirectory ? await Fs.stat(target) : info;
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
};

/**
 * Helpers:
 */
const wrangle = {
  /**
   * Normalise the caller’s input so we always work with an options object.
   *   - string  →  { root: string }
   *   - object  →  unchanged
   */
  options(input: Input): t.HttpServer.ServeStatic.Options<t.HttpServer.Hono.Env> {
    if (typeof input === 'string') return { root: input };
    return { root: '.', ...input };
  },
} as const;
