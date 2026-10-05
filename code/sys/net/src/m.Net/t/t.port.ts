import type { t } from '../common.ts';

/**
 * Tools for working with network ports.
 */
export type PortLib = {
  /**
   * Select a checked port from an integer preference in 0..65535.
   * Undefined delegates to random(); zero delegates allocation to the eventual listener without
   * probing. Nonzero selection checks applicable IPv4/IPv6 wildcards and loopbacks, advancing only
   * over established conflicts: preference plus at most 10000 alternatives, capped at 65535.
   *
   * Invalid preferences throw RangeError before network effects. Probe refusal or ambiguous failure
   * throws the original substrate error without continuing, even when options.throw is false.
   * Restricted grants may therefore refuse selection rather than silently omit IPv6 inspection.
   * Established conflicts throw immediately with options.throw; exhausted search always throws.
   * Successful checks close their listeners; cleanup failure refuses selection.
   * A result is a momentary check, not a reservation.
   */
  get(preference?: t.PortNumber, options?: { throw?: boolean }): t.PortNumber;

  /** Ask the OS for an ephemeral port and close its listener; the returned port is not reserved. */
  random(): t.PortNumber;

  /** Conservative check: conflict or inability to establish availability returns true. */
  inUse(port: t.PortNumber): boolean;
};
