import { type t, Err } from './common.ts';
import { probe, probeTargets } from './u.ts';

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
   * Returns true if the port is considered "in use" on any of the probe targets.
   * Conservative: if probing indicates a conflict OR an ambiguous failure,
   * we treat it as not safely available.
   */
  inUse(port: t.PortNumber): boolean {
    let sawOk = false;
    for (const host of probeTargets()) {
      const res = probe(host, port);
      if (res.kind === 'in_use') return true; // definite conflict on this host
      if (res.kind === 'ok')
        sawOk = true; // at least one host is clear
      else {
        // Any ambiguous/denied/other failure → treat conservatively as "in use".
        // This avoids the false-negative you hit where real bind fails later.
        return true;
      }
    }
    // If we probed and none said "in_use" (and no ambiguous failure), not in use.
    // sawOk guards the edge case where probeTargets() could be empty (it won't be).
    return !sawOk ? true : false;
  },

  get(pref?: t.PortNumber, options: { throw?: boolean } = {}) {
    if (pref === undefined) return Port.random();

    if (!Port.inUse(pref)) return pref;

    if (options.throw) throw Err.std(`Port already in use: ${pref}`);

    // Increment until we find a port that is "not in use" across targets.
    let p = (pref + 1) as t.PortNumber;
    for (let i = 0; i < 10_000; i++) {
      if (!Port.inUse(p)) return p;
      p = (p + 1) as t.PortNumber;
    }
    throw Err.std(`No free port found starting from ${pref}`);
  },
};
