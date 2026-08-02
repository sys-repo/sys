import { Net, type t } from '../common.ts';
import { print } from './u.print.ts';

type F = t.HttpServer.Lib['options'];

/**
 * Generates a Deno.server(...) configuration options object.
 */
export const options: F = (options = {}) => {
  const { pkg, hash } = options;
  const port = Net.port(options.port);
  return {
    port,
    onListen(address) {
      const addr = address as Deno.NetAddr;
      const { dir, name, info, port: requestedPort, status } = options;
      if (!options.silent) print({ addr, pkg, hash, name, info, dir, requestedPort, status });
    },
  };
};
