import type { t } from './common.ts';

/**
 * Flags for the HTTP library.
 */
export const Is: t.HttpIs = {
  netaddr(input: any): input is Deno.NetAddr {
    if (!isObject(input)) return false;
    const addr = input as Deno.NetAddr;

    if (!(addr.transport === 'tcp' || addr.transport === 'udp')) return false;
    return typeof addr.hostname === 'string' && typeof addr.port === 'number';
  },
} as const;

/**
 * Helpers
 */
export function isObject(input: any): input is object {
  return typeof input === 'object' && input !== null;
}
