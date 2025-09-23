import { WebSocketServer } from './common.ts';

/**
 * Gracefully shut down the WebSocket server:
 * - Request each client to close (1001), await 'close' or a hard deadline, then terminate if needed.
 * - Close the server and await its completion callback.
 */
export async function shutdown(wss: WebSocketServer, opts?: { clientGraceMs?: number }) {
  const grace = opts?.clientGraceMs ?? 10_000;

  // Snapshot current clients; the set can mutate while we iterate.
  const clients = Array.from(wss.clients);

  // Per-client graceful close with deadline → terminate.
  const closeClient = (ws: any) =>
    new Promise<void>((resolve) => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        // Remove listener if ws supports off/removeListener
        try {
          ws.off?.('close', onClose);
        } catch {}
        resolve();
      };

      const onClose = () => finish();
      try {
        ws.once?.('close', onClose);
      } catch {}

      // Ask politely:
      try {
        if (ws.readyState === ws.OPEN) {
          ws.close(1001, 'server shutting down');
        } else if (ws.readyState === ws.CLOSING) {
          // already closing → just wait for 'close' or deadline
        } else if (ws.readyState === ws.CLOSED) {
          return finish(); // nothing to do.
        } else {
          // CONNECTING or unknown → ensure we finish eventually.
        }
      } catch {
        // If close throws, we will force-terminate at the deadline.
      }

      // Hard deadline.
      const timer = setTimeout(() => {
        try {
          ws.terminate?.();
        } catch {}
        finish();
      }, grace);
    });

  // Start client shutdowns in parallel.
  const clientPromises = clients.map(closeClient);

  // Close the server (stop accepting new connections) and await callback.
  const serverClosed = new Promise<void>((ok, err) => {
    try {
      wss.close((e: unknown) => (e ? err(e) : ok()));
    } catch (e) {
      err(e);
    }
  });

  // Await clients then server. We settle clients to avoid one bad socket blocking shutdown.
  await Promise.allSettled(clientPromises);
  await serverClosed;
}
