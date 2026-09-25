import { type t, WebSocketServer } from '../common.ts';
import { toWebSocketOptions } from './u.options.ts';

/** Hosted startup convenience for a Files/WebSocket service. */
export const start: t.FilesServer.WebSocket.Lib['start'] = (options) => {
  return WebSocketServer.start<
    t.Files.Cmd.Name,
    t.Files.Cmd.Payload,
    t.Files.Cmd.Result,
    t.Files.Cmd.Event
  >(toWebSocketOptions(options));
};
