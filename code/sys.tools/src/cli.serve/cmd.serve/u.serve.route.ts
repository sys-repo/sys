import { type t, Fs, Str } from '../common.ts';
import { Fmt } from '../u.fmt.ts';
import { Mime } from './u.mime.ts';
import { serveJsonView } from './u.serve.json.ts';
import { makeFilter } from './u.serve.filter.ts';

export type ServeRouteArgs = {
  readonly dir: string;
  readonly contentTypes: readonly t.ServeTool.MimeType[];
};

/**
 * Factory for the main serve route handler.
 *
 * Pure and testable:
 *  - closed over only [dir, contentTypes]
 *  - all runtime deps via imports
 */
export function route(args: ServeRouteArgs): t.HonoMiddlewareHandler {
  const { dir, contentTypes } = args;
  const allowedMimes = new Set<t.ServeTool.MimeType>(contentTypes);

  return async (c) => {
    const viewParam = c.req.query('view');
    const view: t.ServeTool.RouteView | undefined = viewParam === 'json' ? 'json' : undefined;
    const reqPath = c.req.path;

    // Normalise, trim leading slash.
    const rel = reqPath.startsWith('/') ? reqPath.slice(1) : reqPath;
    const fsBasePath = `${dir}/${rel}`;

    /**
     * General 404 handler
     */
    async function notFound(): Promise<string> {
      const filter = makeFilter({ allowedMimes });
      try {
        const tree = await Fmt.folderAsText({ dir, reqPath, filter });
        return tree;
      } catch (error) {
        const msg = Str.builder()
          .line('404 - Not found')
          .line(`Serving from ${dir}`)
          .line(`Path: ${reqPath}`);
        return String(msg);
      }
    }

    /**
     * Resolve the effective file-system target for the request:
     *  - initial path
     *  - optional "index.html" fallback for directories (if allowed)
     *  - derived MIME and flags
     */
    async function resolveTarget(path: t.StringPath) {
      let stat = await Fs.stat(path);

      // Directory → try "index.html" (only if MIME is allowed).
      if (stat && !stat.isFile) {
        const basePath = path.endsWith('/') ? path : `${path}/`;
        const indexPath = `${basePath}index.html`;
        const indexStat = await Fs.stat(indexPath);
        if (indexStat?.isFile) {
          const indexMime = Mime.extensionMap['html'];
          if (indexMime && allowedMimes.has(indexMime as t.ServeTool.MimeType)) {
            path = indexPath;
            stat = indexStat;
          }
        }
      }

      const dotIndex = path.lastIndexOf('.');
      const ext = dotIndex === -1 ? '' : path.slice(dotIndex + 1).toLowerCase();
      const mime = Mime.extensionMap[ext];
      const is = {
        file: Boolean(stat?.isFile),
        allowedMime: Boolean(mime && allowedMimes.has(mime as t.ServeTool.MimeType)),
      };
      return { path, stat, mime, is };
    }

    type Target = Awaited<ReturnType<typeof resolveTarget>>;

    /**
     * Handle the `?view=json` variant for files and folders.
     * Returns a JSON response or `undefined` to continue normal handling.
     */
    async function handleJsonView(target: Target) {
      const { stat, mime, is } = target;
      if (view !== 'json' || !stat) return;

      // Allowed for directories, or files with allowed MIME.
      if (!is.file || is.allowedMime) {
        const path = { fs: target.path, req: reqPath };
        const result = await serveJsonView({ stat, mime, path, allowedMimes });
        const status = result.kind === 'file' ? 200 : 404;
        return c.json(result.body, status);
      }
    }

    const target = await resolveTarget(fsBasePath);
    const jsonResponse = await handleJsonView(target);
    if (jsonResponse) return jsonResponse;

    if (!target.is.file) return c.text(await notFound(), 404);

    // Only allow the configured serve types.
    const { mime } = target;
    if (!mime || !allowedMimes.has(mime as t.ServeTool.MimeType)) {
      return c.text(await notFound(), 404);
    }

    // Load and serve the file manually.
    const file = await Fs.read(target.path);
    if (!file.data) {
      const code = 500;
      const msg = Str.builder()
        .line(`${code} - Failed to load file: ${file.errorReason}`)
        .line(`Serving from ${dir}`);
      return c.text(String(msg), code);
    }

    const body = new Uint8Array(file.data);
    return c.newResponse(body, {
      status: 200,
      headers: {
        'content-type': mime,
        'content-length': String(body.byteLength),
      },
    });
  };
}
