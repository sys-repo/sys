import { D, type t } from '../common.ts';
import { closeSocket } from './u.socket.ts';

export type WebSocketConnection = {
  readonly socket: WebSocket;
  readonly host: t.Cmd.Host.Handle;
};

/** Track a socket/host pair until either side closes. */
export function trackConnection(
  connections: Set<WebSocketConnection>,
  connection: WebSocketConnection,
): void {
  connections.add(connection);

  connection.socket.addEventListener('close', () => {
    connections.delete(connection);
    if (!connection.host.disposed) connection.host.dispose(D.DisposeReason.socketClose);
  }, { once: true });

  connection.host.dispose$.subscribe(() => {
    connections.delete(connection);
    closeSocket(connection.socket, D.close);
  });
}

/** Close every active socket and dispose its command host. */
export function closeConnections(
  connections: Set<WebSocketConnection>,
  reason?: unknown,
): void {
  const active = Array.from(connections);
  connections.clear();

  for (const connection of active) {
    if (connection.host.disposed) closeSocket(connection.socket, D.close);
    else connection.host.dispose(reason);
  }
}
