/**
 * TODO 🐷 move to @sys/net
 */
// export type NetLib = {
//   port,          // existing port allocator
//   waitFor,       // waitFor(ws | other transport types)
//   WebSocket: {
//     waitForOpen, // optional specific helper, if you keep the older name
//   },
// };

/**
 * Wait until the WebSocket is open.
 */
export function waitForOpen(ws: WebSocket): Promise<void> {
  return new Promise((resolve, reject) => {
    if (ws.readyState === WebSocket.OPEN) return resolve();

    const onOpen = () => {
      ws.removeEventListener('open', onOpen);
      ws.removeEventListener('error', onError);
      resolve();
    };

    const onError = (err: Event) => {
      ws.removeEventListener('open', onOpen);
      ws.removeEventListener('error', onError);
      reject(err);
    };

    ws.addEventListener('open', onOpen);
    ws.addEventListener('error', onError);
  });
}
