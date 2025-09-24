import type { t } from './common.ts';

/**
 * Tools for retrieving meta-data about a sync-server.
 */
export type SyncServerInfoLib = {
  /** Retrieve meta-data from the given URL. */
  get(url: t.StringUrl): Promise<SyncServerInfoResponse>;
};

/** Result from probing meta-data of a sync-server endpoint. */
export type SyncServerInfoResponse = {
  readonly url: t.StringUrl;
  readonly elapsed: t.Msecs;
  readonly data: t.SyncServerInfo;
  readonly errors: t.StdError[];
};
