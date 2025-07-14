import { Time, WebSocketServer } from './common.ts';

export function shutdown(wss: WebSocketServer) {
  // Close the socket.
  const stopped = new Promise<void>((ok, err) => wss.close((e) => (e ? err(e) : ok())));

  // Ask each connected peer to disconnect:
  for (const ws of wss.clients) {
    if (ws.readyState === ws.OPEN) {
      ws.close(1001, 'server shutting down'); //   ← Begin the shutdown handshake.
      Time.delay(10_000, () => ws.terminate()); // ← Give the peer up to 10s, then hard-terminate if it ignores the request.
    } else {
      ws.terminate(); // already CLOSING/CLOSED → nuke.
    }
  }

  return stopped;
}
