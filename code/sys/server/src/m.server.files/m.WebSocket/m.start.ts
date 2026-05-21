import { type t, WebSocketServer } from '../common.ts';
import { toWebSocketOptions } from './u.options.ts';

/** Hosted startup convenience for a Files/WebSocket service. */
export const start: t.FilesServer.WebSocket.Lib['start'] = (options) => {
  return WebSocketServer.start<
    t.FilesCmd.Name,
    t.FilesCmd.Payload,
    t.FilesCmd.Result,
    t.FilesCmd.Event
  >(toWebSocketOptions(options));
};
