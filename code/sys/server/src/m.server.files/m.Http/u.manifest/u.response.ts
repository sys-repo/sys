import { Dispose, Err, Json, type t } from '../../common.ts';
import { readManifest } from './u.read.ts';
import { matchesPath } from './u.path.ts';

export async function manifestResponse(
  request: Request,
  files: t.FilesServer.Backing,
  path: t.StringUrlRoute,
  signal?: AbortSignal,
): Promise<Response> {
  if (!matchesPath(request, path)) return textResponse('Not Found', 404);
  if (request.method !== 'GET') return textResponse('Method Not Allowed', 405, { allow: 'GET' });

  let owner: t.Abortable | undefined;
  if (signal === undefined) {
    owner = Dispose.abortable();
    signal = owner.signal;
  }

  try {
    const data = await readManifest(files, signal);
    return jsonResponse(data);
  } catch (cause) {
    const error = Err.std(cause);
    return jsonResponse({ error }, errorStatus(error));
  } finally {
    owner?.dispose();
  }
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(Json.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

function errorStatus(error: t.StdError): number {
  const name = error.name;
  if (name.endsWith('.InvalidPath')) return 400;
  if (name.endsWith('.PolicyDenied')) return 403;
  if (name.endsWith('.PathOutsideRoot')) return 403;
  if (name.endsWith('.NotFound')) return 404;
  if (name.endsWith('.NotDirectory')) return 404;
  if (name.endsWith('.NotFile')) return 404;
  if (name.endsWith('.Unsupported')) return 501;
  return 500;
}

function textResponse(body: string, status: number, headers?: HeadersInit): Response {
  return new Response(body, headers === undefined ? { status } : { status, headers });
}
