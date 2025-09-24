import type { AutomergeUrl, SharePolicy } from '@automerge/automerge-repo';
import type { t } from './common.ts';

/**
 * Tools for working with CRDT sync servers.
 */
export type SyncServerLib = {
  /** Probe a sync-server and resolve with its handshake HTTP header info. */
  readonly probe: ProbeHandshake;

  /** Start a new web-sockets CRDT syncronization-server. */
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
  readonly url: t.StringUrl;
};

/**
 * Headers returned by the sync server on WebSocket upgrade.
 */
export type SyncServerHandsakeHeaders = {
  upgrade: 'websocket';
  connection: 'Upgrade';
  date: t.StringHttpDate;
  'sys-pkg': t.StringScopedPkgNameVer;
  'sec-websocket-accept': string;
};

/**
 * Sync server command-line arguments.
 */
export type SyncServerArgs = {
  port?: number;
  dir?: t.StringDir;
  host: string;
};

/**
 * JSON returned from HTTP/GET to the sync-server end-point.
 */
export type SyncServerInfo = {
  readonly pkg: t.Pkg;
};

/**
 * Probe a sync-server and resolve with its handshake HTTP header info.
 */
export type ProbeHandshake = (
  url: string,
  options?: { timeout?: t.Msecs },
) => Promise<ProbeHandshakeResponse>;

/**
 * Result of probing a sync server, including URL, handshake headers, and elapsed time.
 */
export type ProbeHandshakeResponse = {
  readonly url: t.StringUrl;
  readonly headers: t.SyncServerHandsakeHeaders;
  readonly pkg: t.Pkg;
  readonly elapsed: t.Msecs;
  readonly errors: t.StdError[];
};
