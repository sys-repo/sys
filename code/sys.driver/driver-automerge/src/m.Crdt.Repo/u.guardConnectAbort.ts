import { WebSocketClientAdapter } from '@automerge/automerge-repo-network-websocket';
import { Is, type t } from './common.ts';

/** Own the expected asynchronous handshake-abort error before an intentional disconnect. */
export function guardConnectAbort(adapter: t.NetworkAdapterInterface) {
  if (!(adapter instanceof WebSocketClientAdapter)) return;
  const socket = adapter.socket;
  if (!socket) return;
  // close() enters CLOSING synchronously, before ws delivers its queued handshake-abort error.
  if (socket.readyState !== socket.CONNECTING && socket.readyState !== socket.CLOSING) return;

  // Upstream disconnect removes its error listener before closing. Use the shared browser/Node
  // event surface, and retain this socket-local listener until its asynchronous close completes.
  const onError = (event: Event | { error: unknown }) => {
    if (!('error' in event)) return; // Browser error events expose no underlying Error.
    const error = event.error;
    if (
      Is.error(error) &&
      error.message === 'WebSocket was closed before the connection was established'
    ) {
      return;
    }
    // ws stops dispatch before close if an error listener throws. Release our remaining listener.
    socket.removeEventListener('close', onClose);
    throw error; // Unrelated failures must not become silent teardown success.
  };
  const onClose = () => socket.removeEventListener('error', onError);
  socket.addEventListener('error', onError, { once: true });
  socket.addEventListener('close', onClose, { once: true });
}
