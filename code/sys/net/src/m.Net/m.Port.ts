import { Err, Num, type t } from './common.ts';
import { createPortProbe, type PortListen, type ProbeResult } from './u/u.probe.ts';

const MAX_PORT = 65_535;

/**
 * Host-agnostic port selection with bounded search and conservative availability checks.
 */
export const Port: t.PortLib = createPort();

/** Internal listener seam; not re-exported through the public Net/Port surface. */
export function createPort(listen: PortListen = (options) => Deno.listen(options)): t.PortLib {
  const probes = createPortProbe(listen);

  function inspect(port: number): ProbeResult {
    for (const host of probes.targets()) {
      const result = probes.probe(host, port);
      if (result.kind !== 'ok') return result;
    }
    return { kind: 'ok' };
  }

  const api: t.PortLib = Object.freeze({
    isFixed(value: unknown): value is t.FixedPort {
      return Num.Is.int(value) && value >= 1 && value <= MAX_PORT;
    },

    random() {
      // OS assigns the port; inspecting its address must not retain the listener.
      const listener = listen({ port: 0 });
      try {
        return (listener.addr as Deno.NetAddr).port;
      } finally {
        listener.close();
      }
    },

    inUse(port: t.PortNumber): boolean {
      try {
        return inspect(port).kind !== 'ok';
      } catch {
        // Discovery refusal is no more proof of availability than candidate refusal.
        return true;
      }
    },

    get(pref?: t.PortNumber, options: { throw?: boolean } = {}) {
      if (pref === undefined) return api.random();
      // Port zero delegates allocation to the eventual listener without any probing.
      if (pref === 0) return pref;
      if (!api.isFixed(pref)) {
        throw new RangeError('Port preference must be an integer in 0..65535.');
      }

      const last = Num.clamp(1, MAX_PORT, pref + 10_000);
      // Monotonic bounded traversal without allocating an array of candidate ports.
      let current: number = pref;
      while (current <= last) {
        const result = inspect(current);
        if (result.kind === 'ok') return current;
        if (result.kind !== 'in_use') throw result.err;
        if (options.throw) throw Err.std(`Port already in use: ${pref}`);
        current++;
      }
      throw Err.std(`No free port found starting from ${pref}`);
    },
  });
  return api;
}
