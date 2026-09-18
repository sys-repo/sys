import { Is, type t } from '../common.ts';
import { normalizePath } from './u.origin.ts';

export type AcceptResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly response: Response };

/** Resolve whether a request is admitted to the WebSocket upgrade path. */
export async function acceptRequest(
  request: Request,
  options: {
    readonly path: t.StringUrlRoute;
    readonly accept?: t.WebSocketServer.Accept;
  },
): Promise<AcceptResult> {
  if (!matchesPath(request, options.path)) return reject(404, 'Not Found');
  if (!isWebSocketUpgrade(request)) return reject(426, 'WebSocket upgrade required');

  const accepted = await options.accept?.(request);
  if (accepted instanceof Response) return { ok: false, response: accepted };
  if (accepted === false) return reject(403, 'Forbidden');

  return { ok: true };
}

/**
 * Helpers:
 */
function matchesPath(request: Request, path: t.StringUrlRoute) {
  const url = new URL(request.url);
  return url.pathname === normalizePath(path);
}

function isWebSocketUpgrade(request: Request) {
  const upgrade = request.headers.get('upgrade');
  return Is.string(upgrade) && upgrade.toLowerCase() === 'websocket';
}

function reject(status: number, message: string): AcceptResult {
  return { ok: false, response: new Response(message, { status }) };
}
