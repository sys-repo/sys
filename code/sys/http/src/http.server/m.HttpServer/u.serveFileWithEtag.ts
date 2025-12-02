import { serveFile } from '@std/http/file-server';
import { Fs } from './common.ts';

/**
 * Serve a single file via `serveFile`, adding ETag / If-None-Match handling.
 *
 * - Preserves `Range` / `206 Partial Content` behaviour from `serveFile`.
 * - Uses a stable ETag derived from `{mtime, size}` so we don’t need to
 *   buffer the entire body (keeps streaming semantics intact).
 */
export async function serveFileWithEtag(args: {
  req: Request;
  path: string;
  stat?: Deno.FileInfo;
}): Promise<Response> {
  const { req, path } = args;
  const stat = args.stat ?? (await Fs.stat(path));
  if (!stat || !stat.isFile) {
    return new Response('Not Found', { status: 404 });
  }

  // Simple, stable ETag based on mtime + size (no full-file hashing).
  const mtime = stat.mtime?.getTime() ?? 0;
  const etag = `"${mtime.toString(36)}-${stat.size.toString(36)}"`;

  const ifNoneMatch = req.headers.get('if-none-match');
  if (ifNoneMatch && ifNoneMatch === etag) {
    return new Response(null, {
      status: 304,
      headers: { etag },
    });
  }

  const res = await serveFile(req, path);

  // Preserve body + status, just layer in/override the ETag header.
  const headers = new Headers(res.headers);
  headers.set('etag', etag);

  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers,
  });
}
