import type { t } from '../common.ts';

/** Browser-safe local origin for an HTTP listener. */
export function localOrigin(
  input: { readonly hostname: string; readonly port: number },
): t.StringUrl {
  return `http://${localHost(input.hostname)}:${input.port}` as t.StringUrl;
}

/** Browser-safe host for local bind addresses. */
export function localHost(hostname: string): string {
  return isLocalHostname(hostname) ? 'localhost' : urlHost(hostname);
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
