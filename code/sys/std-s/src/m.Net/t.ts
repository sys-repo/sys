import type { t } from './common.ts';

/**
 * Tools for working with a network.
 */
export type NetLib = {
  readonly Port: t.PortLib;
};

/**
 * Tools for working with network ports.
 */
export type PortLib = {
  /** Retrieve a random unused port number. */
  random(): t.PortNumber;

  /** Determine if the given port number is currently in use. */
  inUse(port: t.PortNumber): boolean;
};
