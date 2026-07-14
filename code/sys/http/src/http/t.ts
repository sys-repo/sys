import type { t } from './common.ts';

/**
 * Universal HTTP contracts.
 */
export declare namespace Http {
  /** Universal HTTP helper library. */
  export type Lib = {
    /** Client-side fetch, cache, URL, and preload helpers. */
    readonly Client: t.HttpClient.Lib;
    /** Server-side HTTP helpers. */
    readonly Server: t.HttpServer.Lib;
    /** Pull-style HTTP request helpers. */
    readonly Pull: t.HttpPull.Lib;

    /** Factory function that makes a new fetch client. */
    readonly client: t.HttpFetch.Lib['make'];
  };
}
