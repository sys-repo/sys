import { type t, Err } from './common.ts';

/**
 * Connects to a hostname (default is "127.0.0.1") and port on a
 * TCP transport and attempts to resolve to the connection.
 */
export const connect: t.TestingServerLib['connect'] = async (port, options = {}) => {
  const { hostname = '127.0.0.1' } = options;
  const started = performance.now();

  let refused = false;
  let error: t.StdError | undefined;
  let remote: Deno.NetAddr | undefined;
  let local: Deno.NetAddr | undefined;

  try {
    const conn = await Deno.connect({ hostname, port });
    remote = conn.remoteAddr as Deno.NetAddr;
    local = conn.localAddr as Deno.NetAddr;
    conn.close(); // ensure we don’t leak descriptors
  } catch (err: any) {
    refused = true;
    error = Err.std(err);
  }

  const ok = !refused && !error;
  const api: t.TestConnectionResponse = {
    ok,
    refused,
    elapsed: performance.now() - started,
    address: { local, remote },
    error,
  };
  return api;
};
