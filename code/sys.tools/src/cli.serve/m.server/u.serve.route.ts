import { Fs, MediaType, serveFileWithEtag, Str, type t } from '../common.ts';
import { Fmt } from '../u.fmt.ts';
import { makeFilter } from './u.serve.filter.ts';
import { serveJsonView } from './u.serve.json.ts';

export type ServeRouteArgs = {
  readonly dir: string;
};

type Target = {
  readonly path: t.StringPath;
  readonly isFile: boolean;
  readonly stat?: Deno.FileInfo;
};

/** Create the main static-file route. */
export function route(args: ServeRouteArgs): t.HttpServer.Hono.MiddlewareHandler {
  const { dir } = args;

  return async (c) => {
    const viewParam = c.req.query('view');
    const view: t.ServeTool.RouteView | undefined = viewParam === 'json' ? 'json' : undefined;
    const reqPath = c.req.path;

    // Normalise, trim leading slash.
    const rel = reqPath.startsWith('/') ? reqPath.slice(1) : reqPath;
    const fsBasePath = `${dir}/${rel}`;

    /** Render the fallback response body. */
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

    /** Resolve a file path, including the directory-index fallback. */
    async function resolveTarget(path: t.StringPath): Promise<Target> {
      let stat = await Fs.stat(path);

      const resolved = await resolveDirectoryIndex({ path, stat });
      path = resolved.path;
      stat = resolved.stat;

      const isFile = stat?.isFile === true;
      return { path, stat, isFile };
    }

    /**
     * Handle the `?view=json` variant for files and folders.
     * Returns a JSON response or `undefined` to continue normal handling.
     */
    async function handleJsonView(target: Target) {
      const { stat } = target;
      if (view !== 'json' || !stat) return;

      const mime = MediaType.fromPath(target.path) ?? MediaType.Fallback.binary;
      const path = { fs: target.path, req: reqPath };
      const result = await serveJsonView({ stat, mime, path });
      const status = result.kind === 'file' ? 200 : 404;
      return c.json(result.body, status);
    }

    const target = await resolveTarget(fsBasePath);
    const jsonResponse = await handleJsonView(target);
    if (jsonResponse) return jsonResponse;

    if (!target.isFile) return c.text(await notFound(), 404);

    // Preserve the shared ETag, Range/206, and streaming response unchanged.
    return serveFileWithEtag({
      req: c.req.raw,
      path: target.path,
      stat: target.stat,
    });
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
