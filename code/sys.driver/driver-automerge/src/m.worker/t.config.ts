import type { t } from './common.ts';

/**
 * Configuration passed over the wire to the worker for repo initialization.
 */
export type CrdtWorkerSpawnConfig = CrdtWorkerSpawnConfigFs | CrdtWorkerSpawnConfigBrowser;
export type CrdtWorkerSpawnConfigFs = {
  kind: 'fs';
  storage?: t.StringDir;
  network?: t.CrdtWebsocketNetworkArg[] | t.Falsy;
  silent?: boolean;
};
export type CrdtWorkerSpawnConfigBrowser = {
  kind: 'web';
  storage?: t.CrdtWebStorageArg;
  network?: t.CrdtWebsocketNetworkArg[] | t.Falsy;
  silent?: boolean;
};
