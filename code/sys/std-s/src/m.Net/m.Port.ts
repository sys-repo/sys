import { type t } from './common.ts';

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
      // NB: successfully closing the port wihtout error signals it's not otherwise in use.
      const listener = Deno.listen({ port });
      listener.close();
      return false;
    } catch {
      return true; // Port IS in use.
    }
  },
};
