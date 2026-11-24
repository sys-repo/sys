import { Bytes, D, Is, Json, Str, type t } from '../common.ts';

/** Decode Cmd JSON strictly; byte reading and classification remain separate. */
export function decodeJson(bytes: Uint8Array<ArrayBuffer>): unknown {
  return Json.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
}

/** Match a route when configured; an omitted path requires mount-owner routing. */
export function matchesPath(request: Request, path: t.StringUrlRoute | undefined): boolean {
  if (!Is.string(path)) return true;
  const value = Str.trimLeadingSlashes(path);
  return new URL(request.url).pathname === (value ? `/${value}` : '/');
}

/** Construct a bounded no-store response, falling back to an empty body. */
export function response(
  data: t.Cmd.Wire.Result | undefined,
  status: number,
  maxBytes: number,
): Response {
  const headers = new Headers({ 'cache-control': 'no-store' });
  if (status === 405) headers.set('allow', D.method);
  if (data === undefined) return new Response(null, { status, headers });
  const body = Json.stringify(data, 0);
  if (Bytes.utf8ByteLength(body) > maxBytes) {
    if (status === 200) throw new Error('Command result exceeded its byte limit.');
    return new Response(null, { status, headers });
  }
  headers.set('content-type', D.Json.contentType);
  return new Response(body, { status, headers });
}
