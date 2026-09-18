import { D, Err, Is, Json, Str, type t } from '../common.ts';

export type JsonResult<D = unknown> =
  | { readonly ok: true; readonly data: D; readonly error: undefined }
  | { readonly ok: false; readonly error: t.StdError };

/** Read a JSON body without throwing. */
export async function readJson<D = unknown>(input: { json(): Promise<D> }): Promise<JsonResult<D>> {
  try {
    return { ok: true, data: await input.json(), error: undefined };
  } catch (error) {
    return { ok: false, error: Err.std(error) };
  }
}

/** Check whether a request matches an optional route path. */
export function matchesPath(request: Request, path: t.StringUrlRoute | undefined): boolean {
  if (!Is.string(path)) return true;

  const expected = normalizePath(path);
  const actual = new URL(request.url).pathname;
  return actual === expected;
}

/** Create a JSON HTTP response. */
export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(Json.stringify(data), {
    status,
    headers: { 'content-type': D.Json.contentType },
  });
}

/** Create a text HTTP response. */
export function textResponse(body: string, status: number, headers?: HeadersInit): Response {
  return new Response(body, { status, headers });
}

/**
 * Helpers:
 */
function normalizePath(path: t.StringUrlRoute): t.StringUrlRoute {
  const value = Str.trimLeadingSlashes(path);
  return (value ? `/${value}` : '/') as t.StringUrlRoute;
}
