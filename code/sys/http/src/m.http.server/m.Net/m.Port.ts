import { type t, Err } from './common.ts';
import { ipv6Supported, probe } from './u.ts';

export const Port: t.PortLib = {
  random() {
    // OS assigns a free port; we close immediately.
    const listener = Deno.listen({ port: 0 });
    try {
      return (listener.addr as Deno.NetAddr).port as t.PortNumber;
    } finally {
      listener.close();
    }
  },

  /**
   * Returns true if the port is considered "in use" on either IPv4 or IPv6.
   * Conservative: if probing indicates a conflict OR an ambiguous failure,
   * we treat it as not safely available.
   */
  inUse(port: t.PortNumber): boolean {
    // IPv4 any-address
    const v4 = probe('0.0.0.0', port);

    // IPv6 any-address (only if supported)
    const v6 = ipv6Supported() ? probe('::', port) : ({ kind: 'not_supported' } as const);

    // If either family is explicitly in use → in use.
    if (v4.kind === 'in_use' || v6.kind === 'in_use') return true;

    // If both families report "ok" → not in use.
    if (
      (v4.kind === 'ok' || v4.kind === 'unavailable') &&
      (v6.kind === 'ok' || v6.kind === 'not_supported' || v6.kind === 'unavailable')
    ) {
      // "unavailable" (e.g., no iface) on a wildcard probe can happen in restricted envs;
      // combine with other family result. If other family is ok, we allow.
      return false;
    }

    // Any ambiguous/denied/other failure → treat conservatively as "in use"
    // This avoids the false-negative you hit where real bind fails later.
    return true;
  },

  get(pref?: t.PortNumber, options: { throw?: boolean } = {}) {
    if (pref === undefined) return Port.random();

    if (!Port.inUse(pref)) return pref;

    if (options.throw) throw Err.std(`Port already in use: ${pref}`);

    // Increment until we find a port that is "not in use" across stacks.
    let p = (pref + 1) as t.PortNumber;
    for (let i = 0; i < 10_000; i++) {
      if (!Port.inUse(p)) return p;
      p = (p + 1) as t.PortNumber;
    }
    throw Err.std(`No free port found starting from ${pref}`);
  },
};

/**
 * Helpers:
 */
