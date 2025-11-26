import type { t } from '../common.ts';
import { fromWebSocket } from './u.from.WebSocket.ts';

/**
 * Transport adapters for wiring Cmd to various message endpoints.
 */
export const Transport: t.CmdTransportLib = {
  fromWebSocket,
};
