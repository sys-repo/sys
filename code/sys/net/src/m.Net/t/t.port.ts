import type { t } from '../common.ts';

/** TCP port selection and availability checks. */
export type PortLib = {
  /**
   * Use the preferred nonzero TCP port if available, otherwise the first available higher port.
   *
   * Preferences must be integers in 0..65535; invalid values throw RangeError before network effects.
   * `undefined` calls `random()`; `0` is returned without probing and lets the eventual listener
   * allocate a port.
   *
   * Nonzero selection checks IPv4 wildcard and loopback addresses, plus IPv6 when supported.
   * Search advances only over confirmed conflicts: the preference plus at most 10000 consecutive
   * higher ports, capped at 65535. `{ throw: true }` rejects an occupied preference instead of
   * searching; exhaustion always throws.
   *
   * Permission refusal and other non-conflict failures throw the original error without continuing,
   * even with `{ throw: false }`. Restricted grants may therefore refuse selection rather than skip
   * IPv6 checks. Successful probes close their listeners; cleanup failure also throws.
   * Availability is checked only momentarily; no port is reserved.
   */
  get(preference?: t.PortNumber, options?: { throw?: boolean }): t.PortNumber;

  /** Ask the OS for an ephemeral port and close its listener; the returned port is not reserved. */
  random(): t.PortNumber;

  /** Conservative check: conflict or inability to establish availability returns true. */
  inUse(port: t.PortNumber): boolean;
};
