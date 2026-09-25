import type { t } from '../common.ts';

type OriginMode = t.HttpServer.Start.OriginMode | undefined;

/** Resolve one listener origin according to the frozen reporting policy. */
export function listenerOrigin(
  input: { hostname: string; port: number; mode?: OriginMode },
): t.StringUrl {
  const hostname = input.mode === 'exact-loopback'
    ? exactLoopbackHost(input.hostname)
    : localHost(input.hostname);
  return `http://${urlHost(hostname)}:${input.port}` as t.StringUrl;
}

/** Validate the requested listener-origin policy before opening a listener. */
export function validateOriginMode(input: { hostname: string; mode?: OriginMode }) {
  if (input.mode === undefined) return;
  if (input.mode === 'exact-loopback') {
    exactLoopbackHost(input.hostname);
    return;
  }
  throw new TypeError('HttpServer.start origin must be exact-loopback when specified');
}

/** Browser-safe local origin for an HTTP listener. */
export function localOrigin(
  input: { hostname: string; port: number },
): t.StringUrl {
  return listenerOrigin(input);
}

/** Browser-safe host for local bind addresses. */
export function localHost(hostname: string): string {
  return isLocalHostname(hostname) ? 'localhost' : hostname;
}

function exactLoopbackHost(hostname: string): string {
  if (hostname === '127.0.0.1' || hostname === '::1') return hostname;
  throw new TypeError(
    'HttpServer.start exact-loopback origin requires a numeric loopback hostname',
  );
}

function isLocalHostname(hostname: string) {
  return LOCAL_HOSTNAMES.has(hostname);
}

function urlHost(hostname: string) {
  return hostname.includes(':') && !hostname.startsWith('[') ? `[${hostname}]` : hostname;
}

const LOCAL_HOSTNAMES = new Set([
  'localhost',
  '0.0.0.0',
  '127.0.0.1',
  '::',
  '[::]',
  '::1',
  '[::1]',
]);
