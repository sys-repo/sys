import { type t, WebSocketServer } from '../common.ts';
import { toWebSocketOptions } from './u.options.ts';

/** Create a running Files/WebSocket service with caller-owned lifecycle. */
export const create: t.FilesServer.WebSocket.Lib['create'] = (options) => {
  return WebSocketServer.create<
    t.FilesCmd.Name,
    t.FilesCmd.Payload,
    t.FilesCmd.Result,
    t.FilesCmd.Event
  >(toWebSocketOptions(options));
};
