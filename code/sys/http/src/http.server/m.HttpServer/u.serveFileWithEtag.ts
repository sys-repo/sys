import { serveFile } from '@std/http/file-server';

import { Fs } from './common.ts';
import { computeEtag } from './u.computeEtag.ts';

/**
 * Serve a single file via `serveFile`, adding ETag / If-None-Match handling.
 *
 * Goals:
 * - Preserve `Range` / `206 Partial Content` behaviour from `serveFile`.
 * - Avoid buffering large bodies (keep streaming semantics).
 * - Be cache-correct for small JSON manifests that are frequently rewritten.
 *
 * Strategy:
 * - For small *.json files (default <= 256 KB), use a strong ETag derived from content hash.
 * - Otherwise, use a stable ETag derived from `{mtime, size}`.
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

  const etag = await computeEtag({ path, stat });
  const ifNoneMatch = req.headers.get('if-none-match');

  if (ifNoneMatch && ifNoneMatchMatches(ifNoneMatch, etag)) {
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

/**
 * Helpers
 */
function ifNoneMatchMatches(ifNoneMatch: string, etag: string): boolean {
  // Spec allows a list: If-None-Match: "a", "b", W/"c"
  // We do a conservative exact match against any trimmed token, including weak prefix.
  const target = etag.trim();
  const tokens = ifNoneMatch.split(',').map((s) => s.trim());
  return tokens.some((t) => t === target || stripWeak(t) === target);
}

function stripWeak(etag: string): string {
  return etag.startsWith('W/') ? etag.slice(2).trim() : etag;
}
