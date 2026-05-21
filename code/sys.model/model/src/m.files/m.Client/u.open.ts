import { Net, type t } from '../common.ts';
import { openError } from './u.error.ts';
import { closeSocket, waitForClose } from './u.socket.ts';

export async function openWebSocket(
  href: t.StringUrl,
  protocols: string | string[] | undefined,
): Promise<{ readonly ws: WebSocket; readonly finished: Promise<CloseEvent | undefined> }> {
  let ws: WebSocket | undefined;

  try {
    ws = new globalThis.WebSocket(href, protocols);
    const finished = waitForClose(ws);
    await Net.waitFor(ws);
    return { ws, finished };
  } catch (cause) {
    if (ws) closeSocket(ws);
    throw openError(href, cause);
  }
}
