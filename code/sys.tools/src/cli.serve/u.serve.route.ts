import { type t, Fs, Str } from './common.ts';
import { Fmt } from './u.fmt.ts';
import { Mime } from './u.mime.ts';
import { serveJsonView } from './u.serve.json.ts';
import { makeFilter } from './u.serve.filter.ts';

export type ServeRouteArgs = {
  readonly dir: string;
  readonly contentTypes: readonly t.MimeType[];
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
  const allowedMimes = new Set<string>(contentTypes);

  return async (c) => {
    const rawUrl = c.req.url;
    const url = new URL(rawUrl, 'http://localhost'); // base only used if relative
    const viewParam = url.searchParams.get('view');
    const reqPath = url.pathname;

    const view: t.ServeRouteView | undefined = viewParam === 'json' ? 'json' : undefined;

    // Normalise, trim leading slash.
    const rel = reqPath.startsWith('/') ? reqPath.slice(1) : reqPath;
    const fsPath = `${dir}/${rel}`;

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

    const stat = await Fs.stat(fsPath);

    // Extract extension.
    const dotIndex = reqPath.lastIndexOf('.');
    const ext = dotIndex === -1 ? '' : reqPath.slice(dotIndex + 1).toLowerCase();
    const mime = Mime.extensionMap[ext];

    const exists = !!stat;
    const isFile = Boolean(stat?.isFile);
    const isAllowedMime = Boolean(mime && allowedMimes.has(mime));

    // Special JSON view.
    if (view === 'json' && exists) {
      if (!isFile || (isFile && isAllowedMime && !!stat)) {
        const result = await serveJsonView({ stat, fsPath, reqPath, mime, allowedMimes });
        const status = result.kind === 'file' ? 200 : 404;
        return c.json(result.body, status);
      }
    }

    if (!isFile) return c.text(await notFound(), 404);

    // Only allow the configured serve types.
    if (!mime || !allowedMimes.has(mime)) return c.text(await notFound(), 404);

    // Load and serve manually.
    const file = await Fs.read(fsPath);
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
