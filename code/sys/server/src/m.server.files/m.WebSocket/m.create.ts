import { type t, WebSocketServer } from '../common.ts';
import { toWebSocketOptions } from './u.options.ts';

/** Create a running Files/WebSocket service with caller-owned lifecycle. */
export const create: t.FilesServer.WebSocket.Lib['create'] = (options) => {
  return WebSocketServer.create<
    t.Files.Cmd.Name,
    t.Files.Cmd.Payload,
    t.Files.Cmd.Result,
    t.Files.Cmd.Event
  >(toWebSocketOptions(options));
};
