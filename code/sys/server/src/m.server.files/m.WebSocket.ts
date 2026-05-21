import type { t } from './common.ts';
import { create } from './m.WebSocket.create.ts';

/** WebSocket service facade for bounded Files backings. */
export const WebSocket: t.FilesServer.WebSocket.Lib = {
  create,
};
