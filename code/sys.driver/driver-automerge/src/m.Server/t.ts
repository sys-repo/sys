import type { AutomergeUrl, SharePolicy } from '@automerge/automerge-repo';
import type { t } from './common.ts';

/**
 * Tools for working with CRDT sync servers.
 */
export type SyncServerLib = {
  /**
   * Start a new web-sockets CRDT syncronization-server.
   */
  ws(options?: SyncServerStartOptions): Promise<t.SyncServer>;
};

/** Options passed to the `CrdtServer.start` method. */
export type SyncServerStartOptions = {
  port?: t.PortNumber;
  host?: string;
  dir?: t.StringDir;
  keyboard?: boolean;
  keepAliveInterval?: t.Msecs;
  sharePolicy?: SharePolicy;
  denylist?: AutomergeUrl[];
  maxClients?: number;
  maxPayload?: number;
  silent?: boolean;
  dispose$?: t.UntilInput;
};

/** Response from the staring a new sync-server: `Server.ws()`. */
export type SyncServer = t.LifecycleAsync & {
  readonly repo: t.CrdtRepo;
  readonly addr: Deno.NetAddr;
};

/**
 * Headers returned by the sync server on WebSocket upgrade.
 */
export type SyncServerResponseHeaders = {
  upgrade: 'websocket';
  connection: 'Upgrade';
  date: t.StringHttpDate;
  'sys-module': t.StringScopedPkgNameVer;
  'sec-websocket-accept': string;
};

/**
 * Sync server command-line arguments.
 */
export type SyncServerArgs = {
  port?: number;
  dir?: t.StringDir;
};
