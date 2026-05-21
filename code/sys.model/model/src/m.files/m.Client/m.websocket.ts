import { Cmd, type t } from '../common.ts';
import { Cmd as FilesCmd } from '../m.Cmd.ts';
import { openWebSocket } from './u.open.ts';

/** Open a WebSocket and return a typed Files Cmd client bound to it. */
export const websocket: t.FilesClient.Lib['websocket'] = async (url, options = {}) => {
  const { timeout } = options;
  const href = String(url) as t.StringUrl;
  const { ws, finished } = await openWebSocket(href, options.protocols);

  const endpoint = Cmd.Transport.fromWebSocket(ws);
  const client = Cmd.make<
    t.FilesCmd.Name,
    t.FilesCmd.Payload,
    t.FilesCmd.Result,
    t.FilesCmd.Event
  >({ ns: FilesCmd.ns }).client(endpoint, { timeout, closeEndpoint: true });

  void finished.then((event) => client.dispose(event ?? 'websocket.close'));

  return Object.assign(client, {
    url: href,
    finished,
    async close(reason?: unknown) {
      client.dispose(reason);
      await finished;
    },
  });
};
