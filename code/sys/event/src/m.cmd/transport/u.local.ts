import type { t } from '../common.ts';

/** Create a local Cmd<T> host bound to one side of a MessageChannel. */
export const local: t.Cmd.Transport.LocalFactory = (input) => {
  const { factory, handlers, hostOptions } = input;
  const { port1, port2 } = new MessageChannel();
  const host = factory.host(port1, handlers, hostOptions);
  let disposed = false;

  return {
    endpoint: port2,
    host,
    dispose(reason?: unknown) {
      if (disposed) return;
      disposed = true;
      host.dispose(reason);
      port1.close();
      port2.close();
    },
  };
};
