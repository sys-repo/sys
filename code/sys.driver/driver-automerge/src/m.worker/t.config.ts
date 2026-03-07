import type { t } from './common.ts';

/**
 * Configuration passed over the wire to the worker for repo initialization.
 */
export type CrdtWorkerConfig = CrdtWorkerConfigWeb | CrdtWorkerConfigFs;
export type CrdtWorkerConfigWeb = {
  kind: 'web';
  storage?: t.CrdtWebStorageArg;
  network?: (t.CrdtWebsocketNetworkArg | t.Falsy)[];
  silent?: boolean;
};
export type CrdtWorkerConfigFs = {
  kind: 'fs';
  storage?: t.StringDir;
  network?: (t.CrdtWebsocketNetworkArg | t.Falsy)[];
  publish?: CrdtWorkerFsPublishConfig;
  silent?: boolean;
};

/**
 * Optional WebSocket command-server configuration for FS-based workers.
 *
 * When provided on `Crdt.Worker.ConfigFs`, the worker will host a
 * CRDT command endpoint using `publishCommands(...)`. This exposes the
 * repo’s typed `Cmd` surface over a WebSocket that remote clients can
 * connect to.
 *
 * Notes:
 * - Applies only to `kind: 'fs'` workers (Deno runtime).
 * - If omitted, the worker does not start a command server.
 * - `hostname` defaults to `"127.0.0.1"` when unspecified.
 */
export type CrdtWorkerFsPublishConfig = {
  readonly port: number;
  readonly hostname?: string;
};
