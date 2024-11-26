import type { t } from './common.ts';

/**
 * Tools for working with a network.
 */
export type NetLib = {
  readonly Port: t.PortLib;
  readonly port: t.PortLib['get'];
};

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
