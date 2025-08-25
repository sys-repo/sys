import type { t } from './common.ts';

/**
 * Tools for working with a network.
 */
export type NetLib = Readonly<{
  Port: t.PortLib;
  port: t.PortLib['get'];
  connect(port: t.PortNumber, options?: NetConnectOptions): Promise<NetConnectResponse>;
}>;

/**
 * Tools for working with network ports.
 */
export type PortLib = {
  /**
   * Retrieves a port number based on the provided preference or defaults to a pre-selected port.
   *
   * @param preference - A preferred port number, which will be used if available,
   *                     otherwise the port number will be incremented until a free port is found.
   * @param options - Additional options to modify retrieval behavior.
   * @param options.throw - If `true`, an error will be thrown the given port preference is in use.
   * @returns The selected port number.
   * @throws Error if no valid port number is available and `options.throw` is `true`.
   */
  get(preference?: t.PortNumber, options?: { throw?: boolean }): t.PortNumber;

  /** Retrieve a random unused port number. */
  random(): t.PortNumber;

  /** Determine if the given port number is currently in use. */
  inUse(port: t.PortNumber): boolean;
};

/**
 * Attempt to open a TCP connection to {port} (and optional {hostname})
 * with retry logic and exponential back-off.
 *
 * Resolves with the **remote** `Deno.NetAddr` once the socket is open.
 */
export type NetConnectOptions = {
  /** Hostname or IP to connect to (default `'127.0.0.1'`). */
  hostname?: string;
  /** Maximum connection attempts before giving up (default `10`). */
  attempts?: number;
  /** Delay (ms) before the first retry (default `100`). */
  delay?: t.Msecs;
  /** Factor applied to each subsequent delay (default `1.5`). */
  backoff?: number;
};

/**
 * Resposne from the `Net.connect` method:
 */
export type NetConnectResponse = Readonly<{
  socket?: Deno.TcpConn;
  error?: t.StdError;
}>;
