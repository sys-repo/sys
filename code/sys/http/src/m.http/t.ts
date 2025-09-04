import type { t } from './common.ts';

/**
 * Universal (client + server) HTTP namespace.
 */
export type HttpLib = {
  readonly Client: t.HttpClientLib;
  readonly Server: t.HttpServerLib;

  /** Factory function that makes a new fetch client. */
  readonly client: t.HttpFetchLib['make'];
};
