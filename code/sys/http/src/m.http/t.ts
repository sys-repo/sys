import type { t } from './common.ts';

/**
 * Universal (client + server) HTTP namespace.
 */
export type HttpLib = {
  readonly Client: t.HttpClientLib;
  readonly Server: t.HttpServerLib;
  readonly Pull: t.HttpPullLib;

  /** Factory function that makes a new fetch client. */
  readonly client: t.HttpFetchLib['make'];
};
