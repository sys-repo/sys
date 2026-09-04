import type { t } from './common.ts';

/**
 * Universal HTTP contracts.
 */
export declare namespace Http {
  /**
   * Universal HTTP helper library.
   */
  export type Lib = {
    /** Client-side fetch, cache, URL, and preload helpers. */
    readonly Client: t.HttpClient.Lib;
    /** Server-side HTTP helpers. */
    readonly Server: t.HttpServer.Lib;

    /**
     * Create one bounded Fetch client.
     */
    readonly client: t.HttpFetch.Lib['make'];
  };
}
