import type { t } from './common.ts';

/**
 * Server for working with the Deno cloud.
 */
export type DenoCloudClientLib = {
  /**
   * Factory to create a new HTTP client.
   */
  client(base: t.StringUrl, options?: t.DenoCloudClientOptions): t.DenoCloudClient;
};
export type DenoCloudClientOptions = { accessToken?: t.StringJwt };

/**
 * HTTP client for working with the Deno cloud.
 */
export type DenoCloudClient = {
  readonly url: t.HttpUrl;
  info(): Promise<t.FetchResponse<t.RootResponse>>;
};
