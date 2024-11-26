import type { t } from './common.ts';
import { print } from './u.log.ts';

/**
 * Generates a Deno.server(...) configuration options object.
 */
export const options: t.HttpServerLib['options'] = (port, pkg, hash) => {
  return {
    port,
    onListen: (addr) => print(addr as Deno.NetAddr, pkg, hash),
  };
};
