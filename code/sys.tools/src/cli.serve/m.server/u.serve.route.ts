import { type t, Fs, Str, serveFileWithEtag } from '../common.ts';
import { Fmt } from '../u.fmt.ts';
import { Mime } from './u.mime.ts';
import { makeFilter } from './u.serve.filter.ts';
import { serveJsonView } from './u.serve.json.ts';

export type ServeRouteArgs = {
  readonly dir: string;
};

type Target = {
  readonly path: t.StringPath;
  readonly mime: t.ServeTool.ServedMimeType;
  readonly is: { readonly file: boolean };
  readonly stat?: Deno.FileInfo;
};

/**
 * Factory for the main serve route handler.
 *
 * Pure and testable:
 *  - closed over only [dir]
 *  - all runtime deps via imports
 */
export function route(args: ServeRouteArgs): t.HonoMiddlewareHandler {
  const { dir } = args;

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
      const filter = makeFilter();
      try {
        const tree = await Fmt.folderAsText({ dir, reqPath, filter });
        return tree;
      } catch (_error) {
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
     *  - optional "index.html" fallback for directories
     *  - derived MIME and flags
     */
    async function resolveTarget(path: t.StringPath): Promise<Target> {
      let stat = await Fs.stat(path);

      const resolved = await resolveDirectoryIndex({ path, stat });
      path = resolved.path;
      stat = resolved.stat;

      const dotIndex = path.lastIndexOf('.');
      const ext = dotIndex === -1 ? '' : path.slice(dotIndex + 1).toLowerCase();
      const mime = Mime.extensionMap[ext] ?? Mime.fallback;
      const is = {
        file: Boolean(stat?.isFile),
      };
      return { path, stat, mime, is };
    }

    /**
     * Handle the `?view=json` variant for files and folders.
     * Returns a JSON response or `undefined` to continue normal handling.
     */
    async function handleJsonView(target: Target) {
      const { stat, mime } = target;
      if (view !== 'json' || !stat) return;

      const path = { fs: target.path, req: reqPath };
      const result = await serveJsonView({ stat, mime, path });
      const status = result.kind === 'file' ? 200 : 404;
      return c.json(result.body, status);
    }

    const target = await resolveTarget(fsBasePath);
    const jsonResponse = await handleJsonView(target);
    if (jsonResponse) return jsonResponse;

    if (!target.is.file) return c.text(await notFound(), 404);
    const { mime } = target;

    /**
     * Delegate to shared HTTP helper:
     *  - preserves Range / 206 from `serveFile`
     *  - adds ETag / If-None-Match handling
     *
     * We adapt the Response back through `c.newResponse` so the
     * test fixture’s capture hooks still see a "response" hit.
     */
    const reqAny = c.req as unknown as { raw?: Request; url: string };
    const req = reqAny.raw instanceof Request ? reqAny.raw : new Request(reqAny.url);

    const res = await serveFileWithEtag({
      req,
      path: target.path,
      stat: target.stat,
    });

    // For 304 (and any status with no body), keep the body null.
    let body: Uint8Array | null = null;
    if (res.body && res.status !== 304) {
      const buf = await res.arrayBuffer();
      body = new Uint8Array(buf);
    }

    // Convert Headers → plain record for our fixture’s capture + ResponseInit,
    // but normalise Content-Type to the route’s explicit MIME (no charset).
    const headers: Record<string, string> = {};
    res.headers.forEach((value, key) => {
      const k = key.toLowerCase();
      if (k === 'content-type' && mime) {
        headers[key] = mime;
      } else {
        headers[key] = value;
      }
    });

    const init: ResponseInit = {
      status: res.status,
      headers,
    };

    return c.newResponse(body as any, init as any);
  };
}

/**
 * Resolve a directory path to an "index.html" file, if present.
 */
async function resolveDirectoryIndex(args: {
  path: t.StringPath;
  stat?: Deno.FileInfo;
}): Promise<{ path: t.StringPath; stat?: Deno.FileInfo }> {
  let { path, stat } = args;

  if (stat && !stat.isFile) {
    const basePath = path.endsWith('/') ? path : `${path}/`;
    const indexPath = `${basePath}index.html`;
    const indexStat = await Fs.stat(indexPath);
    if (indexStat?.isFile) {
      path = indexPath;
      stat = indexStat;
    }
  }

  return { path, stat };
}
