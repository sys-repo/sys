import type { t } from './common.ts';
import { WebSocket } from './m.WebSocket.ts';

/** Files server facades over bounded Files model backings. */
export const FilesServer: t.FilesServer.Lib = {
  WebSocket,
};
