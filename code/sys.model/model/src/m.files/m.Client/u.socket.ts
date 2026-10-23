export function closeSocket(ws: WebSocket) {
  if (ws.readyState === WebSocket.CLOSING || ws.readyState === WebSocket.CLOSED) return;
  ws.close();
}

export function waitForClose(ws: WebSocket): Promise<CloseEvent | undefined> {
  if (ws.readyState === WebSocket.CLOSED) return Promise.resolve(undefined);

  return new Promise((resolve) => {
    ws.addEventListener('close', (event) => resolve(event as CloseEvent), { once: true });
  });
}
