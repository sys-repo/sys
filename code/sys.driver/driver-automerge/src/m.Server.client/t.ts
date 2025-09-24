import type { t } from './common.ts';

/**
 * Tools for retrieving meta-data about a sync-server.
 */
export type SyncServerInfoLib = {
  /** Retrieve meta-data from the given URL. */
  get(url: t.StringUrl): Promise<SyncServerInfo>;
};

/** Result from probing meta-data of a sync-server endpoint. */
export type SyncServerInfo = {
  readonly url: t.StringUrl;
  readonly pkg: t.Pkg;
  readonly elapsed: t.Msecs;
  readonly errors: t.StdError[];
};
