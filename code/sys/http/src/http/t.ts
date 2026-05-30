import type { t } from './common.ts';

/**
 * Universal HTTP contracts.
 */
export declare namespace Http {
  /** Universal HTTP helper library. */
  export type Lib = {
    readonly Client: t.HttpClient.Lib;
    readonly Server: t.HttpServer.Lib;
    readonly Pull: t.HttpPull.Lib;

    /** Factory function that makes a new fetch client. */
    readonly client: t.HttpFetch.Lib['make'];
  };
}
