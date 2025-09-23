import type { AutomergeUrl, SharePolicy } from '@automerge/automerge-repo';
import type { t } from './common.ts';

/**
 * Tools for working with CRDT sync servers.
 */
export type CrdtServerLib = {
  /**
   * Start a new web-sockets CRDT syncronization-server.
   */
  ws(options?: CrdtServerStartOptions): Promise<t.CrdtSyncServer>;
};

/** Options passed to the `CrdtServer.start` method. */
export type CrdtServerStartOptions = {
  port?: t.PortNumber;
  host?: string;
  dir?: t.StringDir;
  keyboard?: boolean;
  keepAliveInterval?: t.Msecs;
  sharePolicy?: SharePolicy;
  denylist?: AutomergeUrl[];
  silent?: boolean;
  dispose$?: t.UntilInput;

  /** Runtime hardening knobs. */
  maxClients?: number;
  maxPayload?: number;
};

/** Response from the `CrdtServer.start` method. */
export type CrdtSyncServer = t.LifecycleAsync & {
  readonly repo: t.CrdtRepo;
  readonly addr: Deno.NetAddr;
};
