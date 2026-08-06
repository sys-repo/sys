/**
 * @module
 * WebSocket command server primitive.
 */
import type { t } from './common.ts';
import { create } from './u/u.create.ts';
import { start } from './u/u.start.ts';

/**
 * WebSocket command server primitive.
 */
export const WebSocketServer: t.WebSocketServer.Lib = {
  create,
  start,
};
