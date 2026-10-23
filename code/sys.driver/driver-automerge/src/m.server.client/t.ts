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
    /** URL that was probed. */
    readonly url: t.StringUrl;
    /** Elapsed probe time in milliseconds. */
    readonly elapsed: t.Msecs;
    /** Sync-server metadata returned by the endpoint. */
    readonly data: t.SyncServer.Info;
    /** Non-fatal probe errors collected while deriving metadata. */
    readonly errors: t.StdError[];
  };
}
