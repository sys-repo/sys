import type { t } from '../common.ts';

/**
 * Attempt to open a TCP connection to {port} (and optional {hostname})
 * with retry logic and exponential back-off.
 */
export type NetConnectOptions = {
  /** Hostname or IP to connect to (default `127.0.0.1`). */
  hostname?: string;
  /** Maximum connection attempts before giving up (default `10`). */
  attempts?: number;
  /** Delay (ms) before the first retry (default `100`). */
  delay?: t.Msecs;
  /** Factor applied to each subsequent delay (default `1.5`). */
  backoff?: number;
};

/**
 * Response from the `Net.connect` method.
 */
export type NetConnectResponse = {
  readonly socket?: Deno.TcpConn;
  readonly error?: t.StdError;
};
