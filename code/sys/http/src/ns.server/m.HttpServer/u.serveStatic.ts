import { serveFile } from '@std/http/file-server';
import { type t, Path, Fs } from './common.ts';

type Input = Parameters<t.HttpServeStatic>[0];

/**
 * Serve static files.
 * Note:
 *    Implemented with `serveFile()` so that Range requests
 *    (e.g. `Range: bytes=0-`) are honoured with `206 Partial Content`
 *    which the Hono serveStatic helper does not support (as of version `hono@0.7.10`).
 */
export const serveStatic: t.HttpServeStatic = (input: Input) => {
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
      return await serveFile(c.req.raw, target);
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
  options(input: Input): t.HttpServeStaticOptions<t.HonoEnv> {
    if (typeof input === 'string') return { root: input };
    return { root: '.', ...input };
  },
} as const;
