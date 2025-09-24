import type { t } from './common.ts';

/**
 * Result of probing a sync server, including URL, handshake headers, and elapsed time.
 */
export type ProbeResult = {
  readonly url: t.StringUrl;
  readonly headers: t.SyncServerHandsakeHeaders;
  readonly pkg: t.Pkg;
  readonly elapsed: t.Msecs;
  readonly errors: t.StdError[];
};

/**
 * Function that probes a sync server and resolves with its handshake HTTP header info.
 */
export type ProbeSyncServer = (
  url: string,
  options?: { timeout?: t.Msecs },
) => Promise<ProbeResult>;
