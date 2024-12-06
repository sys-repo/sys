import type { t } from './common.ts';
import { print } from './u.log.ts';

type F = t.HttpServerLib['options'];

/**
 * Generates a Deno.server(...) configuration options object.
 */
export const options: F = (port, pkg, hash) => {
  return {
    port,
    onListen(address) {
      const addr = address as Deno.NetAddr;
      print({ addr, pkg, hash });
    },
  };
};
