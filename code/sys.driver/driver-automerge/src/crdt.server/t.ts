import type { AutomergeUrl, SharePolicy } from '@automerge/automerge-repo';
import type { t } from './common.ts';

/**
 * Tools for working with CRDT sync servers.
 */
export type CrdtServerLib = {
  /**
   * Start a new web-socket sync server.
   */
  start(options?: CrdtServerStartOptions): Promise<void>;
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
