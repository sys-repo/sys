import type { t } from '../common.ts';
import { fromWebSocket } from './u.from.WebSocket.ts';
import { local } from './u.local.ts';

export { fromWebSocket, local };

/**
 * Transport adapters for wiring Cmd to various message endpoints.
 */
export const Transport: t.Cmd.Transport.Lib = {
  fromWebSocket,
  local,
};
