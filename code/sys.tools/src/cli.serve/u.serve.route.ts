import { type t, Fs, Str } from './common.ts';
import { Fmt } from './u.fmt.ts';
import { Mime } from './u.mime.ts';

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
  const mimeByExt = Mime.extensionMap;
  const allowedMimes = new Set<string>(contentTypes);

  return async (c) => {
    const reqPath = c.req.path;

    // Normalise, trim leading slash.
    const rel = reqPath.startsWith('/') ? reqPath.slice(1) : reqPath;
    const filePath = `${dir}/${rel}`;

    const notFound = async (): Promise<string> => {
      const tree = await Fmt.folderAsText({ dir, reqPath });
      return tree;
    };

    const stat = await Fs.stat(filePath);
    if (!stat?.isFile) return c.text(await notFound(), 404);

    // Extract extension.
    const dotIndex = reqPath.lastIndexOf('.');
    const ext = dotIndex === -1 ? '' : reqPath.slice(dotIndex + 1).toLowerCase();
    const mime = mimeByExt[ext];

    // Only allow the configured serve types.
    if (!mime || !allowedMimes.has(mime)) return c.text(await notFound(), 404);

    // Load and serve manually.
    const file = await Fs.read(filePath);
    if (!file.data) {
      const code = 500;
      const msg = Str.builder()
        .line(`${code} - Failed to load file: ${file.errorReason}`)
        .line(`Serving from ${dir}`)
        .toString();
      return c.text(msg, code);
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
