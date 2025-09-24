import type { t } from './common.ts';
import { probe } from './u.probe.ts';
import { ws } from './u.ws.ts';

/**
 * Tools for working with CRDT sync servers:
 */
export const Server: t.SyncServerLib = {
  ws,
  probe,
};
