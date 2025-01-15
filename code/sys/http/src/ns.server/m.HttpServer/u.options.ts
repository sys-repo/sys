import { type t, Net } from './common.ts';
import { print } from './u.log.ts';

type F = t.HttpServerLib['options'];

/**
 * Generates a Deno.server(...) configuration options object.
 */
export const options: F = (...input: any[]) => {
  const options = wrangle.options(input);
  const { pkg, hash } = options;
  const port = Net.port(options.port);
  return {
    port,
    onListen(address) {
      const addr = address as Deno.NetAddr;
      const requestedPort = options.port;
      print({ addr, pkg, hash, requestedPort });
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
