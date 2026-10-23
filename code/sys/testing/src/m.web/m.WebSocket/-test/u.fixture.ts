/** Resolve when the WebSocket emits its next open event. */
export function opened(ws: WebSocket): Promise<void> {
  return new Promise((resolve) => ws.addEventListener('open', () => resolve(), { once: true }));
}

/** Resolve when the WebSocket emits its next close event. */
export function closeEvent(ws: WebSocket): Promise<void> {
  return new Promise((resolve) => ws.addEventListener('close', () => resolve(), { once: true }));
}
