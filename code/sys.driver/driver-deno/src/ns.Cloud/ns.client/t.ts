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
  readonly subhosting: DenoCloudClientSubhosting;
  info(): Promise<t.FetchResponse<t.RootResponse>>;
};

/**
 * HTTP client for the subhosting deployment cloud.
 */
export type DenoCloudClientSubhosting = {
  info(): Promise<t.FetchResponse<t.SubhostingInfo>>;
  projects(): Promise<t.FetchResponse<t.SubhostingProjectsInfo>>;
};
