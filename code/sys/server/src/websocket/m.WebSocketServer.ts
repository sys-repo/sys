import type { t } from './common.ts';
import { create } from './u.create.ts';

/**
 * WebSocket command server primitive.
 */
export const WebSocketServer: t.WebSocketServer.Lib = {
  create,
};
