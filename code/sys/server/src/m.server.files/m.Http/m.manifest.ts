import { D, Err, Files, Json, Str, type t } from '../common.ts';

/** Create a GET JSON projection of the Files manifest command when supported. */
export function manifest(
  options: t.FilesServer.Http.ManifestOptions,
): t.FilesServer.Http.ManifestProjection | undefined {
  if (options.files.capabilities.manifest !== true) return undefined;

  const path = manifestPath(options.path);

  return {
    path,
    label: 'files:manifest',
    matches: (request) => matchesPath(request, path),
    response: (request) => manifestResponse(request, options.files, path),
  };
}

/**
 * Helpers:
 */
async function manifestResponse(
  request: Request,
  files: t.FilesServer.Backing,
  path: t.StringUrlRoute,
): Promise<Response> {
  if (!matchesPath(request, path)) return textResponse('Not Found', 404);
  if (request.method !== 'GET') return textResponse('Method Not Allowed', 405, { allow: 'GET' });

  try {
    const data = await readManifest(request, files);
    return jsonResponse(data);
  } catch (cause) {
    const error = Err.std(cause);
    return jsonResponse({ error }, errorStatus(error));
  }
}

async function readManifest(
  request: Request,
  files: t.FilesServer.Backing,
): Promise<t.Files.Manifest> {
  const controller = new AbortController();
  const abort = () => controller.abort(request.signal.reason ?? 'request-abort');
  if (request.signal.aborted) abort();
  else request.signal.addEventListener('abort', abort, { once: true });

  try {
    const name = Files.Cmd.Name.manifest;
    const context: t.Cmd.Handler.Context<
      t.Files.Cmd.Name,
      t.Files.Cmd.Event,
      typeof name
    > = {
      id: 'req-files-manifest-http' as t.Cmd.ReqId,
      name,
      ns: Files.Cmd.ns,
      signal: controller.signal,
      emit() {
        // The HTTP manifest projection is unary; manifest emits no events.
      },
    };

    return await files.handlers[name]({}, context);
  } finally {
    request.signal.removeEventListener('abort', abort);
  }
}

function manifestPath(path: t.StringUrlRoute | undefined): t.StringUrlRoute {
  const base = normalizePath(path ?? D.path);
  return (base === '/' ? '/manifest' : `${base}/manifest`) as t.StringUrlRoute;
}

function matchesPath(request: Request, path: t.StringUrlRoute): boolean {
  const actual = new URL(request.url).pathname;
  return actual === path;
}

function normalizePath(path: t.StringUrlRoute): t.StringUrlRoute {
  const suffix = Str.trimSlashes(path);
  return (suffix ? `/${suffix}` : '/') as t.StringUrlRoute;
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
