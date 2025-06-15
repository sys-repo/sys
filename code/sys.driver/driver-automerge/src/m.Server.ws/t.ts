import type { AutomergeUrl, SharePolicy } from '@automerge/automerge-repo';
import type { t } from './common.ts';

/**
 * Tools for working with CRDT sync servers.
 */
export type CrdtServerLib = {
  /**
   * Start a new web-sockets CRDT syncronization-server.
   */
  ws(options?: CrdtServerStartOptions): Promise<t.CrdtServerStartResponse>;
};

/** Response from the `CrdtServer.start` method. */
export type CrdtServerStartResponse = {
  readonly repo: t.CrdtRepo;
};

/** Options passed to the `CrdtServer.start` method. */
export type CrdtServerStartOptions = {
  port?: t.PortNumber;
  keyboard?: boolean;
  keepAliveInterval?: t.Msecs;
  sharePolicy?: SharePolicy;
  denylist?: AutomergeUrl[];
  dir?: t.StringDir;
};
