import type { t } from './common.ts';
import { print } from './u.log.ts';

type F = t.HttpServerLib['options'];

/**
 * Generates a Deno.server(...) configuration options object.
 */
export const options: F = (...input: any[]) => {
  const options = wrangle.options(input);
  const { port, pkg, hash } = options;
  return {
    port,
    onListen(address) {
      const addr = address as Deno.NetAddr;
      print({ addr, pkg, hash });
    },
  };
};

/**
 * Helpers
 */
const wrangle = {
  options(args: any[]): t.HttpServerOptionsOptions {
    if (typeof args[0] === 'object') return args[0];
    return {
      port: args[0],
      pkg: args[1],
      hash: args[2],
    };
  },
} as const;
