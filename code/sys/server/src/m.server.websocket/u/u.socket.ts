import { Try } from '../common.ts';

export type WebSocketCloseArgs = {
  readonly code?: number;
  readonly reason?: string;
};

/** True when a socket cannot usefully receive another close request. */
export function isClosingOrClosed(socket: WebSocket): boolean {
  return socket.readyState === WebSocket.CLOSING || socket.readyState === WebSocket.CLOSED;
}

/** Best-effort close that is safe across already-closing sockets. */
export function closeSocket(socket: WebSocket, args?: WebSocketCloseArgs): void {
  if (isClosingOrClosed(socket)) return;
  Try.run(() => {
    if (args) socket.close(args.code, args.reason);
    else socket.close();
  });
}
