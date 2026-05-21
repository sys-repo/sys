import { D, Str, type t } from '../common.ts';

/** Normalize a WebSocket route path. */
export function normalizePath(path: t.StringUrlRoute = D.path): t.StringUrlRoute {
  const suffix = Str.trimSlashes(path);
  return (suffix ? `/${suffix}` : '/') as t.StringUrlRoute;
}

/** Build the local HTTP origin for a bound server address. */
export function localOrigin(args: {
  readonly hostname: t.StringHostname;
  readonly port: t.PortNumber;
}): t.StringUrl {
  return `http://${localHost(args.hostname)}:${args.port}` as t.StringUrl;
}

/** Build the local WebSocket URL for the accepted server route. */
export function localWebSocketUrl(args: {
  readonly origin: t.StringUrl;
  readonly path: t.StringUrlRoute;
}): t.StringUrl {
  const url = new URL(normalizePath(args.path), args.origin);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  return url.href as t.StringUrl;
}

/**
 * Helpers:
 */
function localHost(hostname: string): string {
  if (hostname === D.public.hostname) return D.local.hostname;
  if (hostname === '::' || hostname === '[::]') return '[::1]';
  return urlHost(hostname);
}

function urlHost(hostname: string): string {
  return hostname.includes(':') && !hostname.startsWith('[') ? `[${hostname}]` : hostname;
}
