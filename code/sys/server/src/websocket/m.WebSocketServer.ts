import type { t } from './common.ts';
import { create } from './u.create.ts';
import { start } from './u.start.ts';

/**
 * WebSocket command server primitive.
 */
export const WebSocketServer: t.WebSocketServer.Lib = {
  create,
  start,
};
