import type { t } from '../common.ts';
import { create } from './m.create.ts';
import { start } from './m.start.ts';

/** WebSocket service facade for bounded Files backings. */
export const WebSocket: t.FilesServer.WebSocket.Lib = Object.freeze({
  create,
  start,
});
