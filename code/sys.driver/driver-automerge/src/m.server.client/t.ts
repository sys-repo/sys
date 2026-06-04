import type { t } from './common.ts';

/**
 * Sync-server client contracts.
 */
export declare namespace ServerInfo {
  /** Tools for retrieving metadata about a sync-server. */
  export type Lib = {
    /** Retrieve metadata from the given URL. */
    get(url: t.StringUrl): Promise<Response>;
  };

  /** Result from probing metadata of a sync-server endpoint. */
  export type Response = {
    readonly url: t.StringUrl;
    readonly elapsed: t.Msecs;
    readonly data: t.SyncServer.Info;
    readonly errors: t.StdError[];
  };
}
