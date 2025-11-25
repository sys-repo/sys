/**
 * True if the value structurally matches a WebSocket.
 */
export function websocket(input: unknown): input is WebSocket {
  return (
    typeof input === 'object' &&
    input !== null &&
    typeof (input as WebSocket).send === 'function' &&
    typeof (input as WebSocket).close === 'function' &&
    typeof (input as WebSocket).addEventListener === 'function'
  );
}
