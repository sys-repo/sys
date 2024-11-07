import { type t, Err } from './common.ts';

export const Port: t.PortLib = {
  random() {
    // NB: attempting to listen on port 0 allows the OS to assign an available port.
    const listener = Deno.listen({ port: 0 });
    try {
      return listener.addr.port;
    } finally {
      listener.close(); // Immediately close.
    }
  },

  inUse(port: t.PortNumber) {
    try {
      // NB: successfully closing the port without error signals it's not otherwise in use.
      const listener = Deno.listen({ port });
      listener.close();
      return false;
    } catch {
      return true; // Port IS already in use.
    }
  },

  get(pref, options = {}) {
    if (pref === undefined) return Port.random();
    if (!Port.inUse(pref)) {
      return pref;
    } else {
      if (options.throw) throw Err.std(`Port already in use: ${pref}`);

      // Recursively increment to find the next available port.
      const next = (port: number): number => (Port.inUse(port) ? next(port + 1) : port);
      return next(pref + 1);
    }
  },
};
