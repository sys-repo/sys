import { Net, type t } from '../common.host.ts';
import { print } from './u.print.ts';

type F = t.HttpServer.Lib['options'];

export type OptionsDependencies = {
  readonly selectPort: typeof Net.port;
};

const DEFAULT_DEPS: OptionsDependencies = { selectPort: Net.port };

/**
 * Generates a Deno.server(...) configuration options object.
 */
export const options: F = (input = {}) => optionsWith(DEFAULT_DEPS, input);

/** Package-internal port-selection dependency seam. */
export function optionsWith(
  deps: OptionsDependencies,
  input: NonNullable<Parameters<F>[0]> = {},
) {
  const { pkg, hash } = input;
  const port = input.strictPort && input.port !== undefined
    ? input.port
    : deps.selectPort(input.port);
  return {
    port,
    onListen(addr: Deno.NetAddr) {
      const { dir, name, info, port: requestedPort, status } = input;
      if (!input.silent) print({ addr, pkg, hash, name, info, dir, requestedPort, status });
    },
  };
}
