import { Cmd, type t } from '../common.ts';
import { transport } from './m.transport.ts';
import { openWebSocket } from './u.open.ts';
import { closeSocket } from './u.socket.ts';

/** Open a WebSocket and return a Files client handle bound to it. */
export const websocket: t.Files.Client.Lib['websocket'] = async (url, options = {}) => {
  const { timeout } = options;
  const href = String(url) as t.StringUrl;
  const { ws, finished } = await openWebSocket(href, options.protocols);

  const endpoint = Cmd.Transport.fromWebSocket(ws);
  const files = transport(endpoint, { timeout, closeEndpoint: true });

  void finished.then((event) => files.dispose(event ?? 'websocket.close'));

  return Object.assign(files, {
    url: href,
    finished,
    async close(reason?: unknown) {
      files.dispose(reason);
      closeSocket(ws);
      await finished;
    },
  });
};
