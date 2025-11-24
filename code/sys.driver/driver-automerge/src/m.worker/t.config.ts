import type { t } from './common.ts';

/**
 * Configuration passed over the wire to the worker for repo initialization.
 */
export type CrdtWorkerConfig = CrdtWorkerConfigFs | CrdtWorkerConfigWeb;
export type CrdtWorkerConfigFs = {
  kind: 'fs';
  storage?: t.StringDir;
  network?: (t.CrdtWebsocketNetworkArg | t.Falsy)[];
  silent?: boolean;
};
export type CrdtWorkerConfigWeb = {
  kind: 'web';
  storage?: t.CrdtWebStorageArg;
  network?: (t.CrdtWebsocketNetworkArg | t.Falsy)[];
  silent?: boolean;
};
