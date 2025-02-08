import { Http, type t } from './common.ts';

/**
 * Factory: Client Library
 *
 *      A strongly typed HTTP client for working against
 *      a DenoCloud (Deploy™️ or Subhosting™️) server HTTP endpoint.
 *
 * - https://deno.com/deploy
 * - https://docs.deno.com/subhosting/manual
 *
 */
export const client: t.DenoCloudClientLib['client'] = (base, options = {}) => {
  const { accessToken } = options;
  const url = Http.url(base);
  const fetch = Http.fetch({ accessToken });

  /**
   * API
   */
  const api: t.DenoCloudClient = {
    url,
    async info() {
      const url = api.url.join('/');
      return fetch.json<t.RootResponse>(url);
    },
    subhosting: {
      async info() {
        const url = api.url.join('/subhosting');
        return fetch.json<t.SubhostingInfo>(url);
      },
      async projects() {
        const url = api.url.join('/subhosting/projects');
        return fetch.json<t.SubhostingProjectsInfo>(url);
      },
    },
  };
  return api;
};
