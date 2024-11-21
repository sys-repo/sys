import { type t, isObject } from './common.ts';
import { statusOK } from './u.ts';

/**
 * Flags for the HTTP library.
 */
export const Is: t.HttpIs = {
  statusOK,

  netaddr(input: any): input is Deno.NetAddr {
    if (!isObject(input)) return false;
    const addr = input as Deno.NetAddr;

    if (!(addr.transport === 'tcp' || addr.transport === 'udp')) return false;
    return typeof addr.hostname === 'string' && typeof addr.port === 'number';
  },
} as const;
