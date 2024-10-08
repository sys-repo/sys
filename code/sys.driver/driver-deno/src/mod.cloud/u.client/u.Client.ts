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
  const client = Http.client({ accessToken });

  /**
   * API
   */
  const api: t.DenoCloudClient = {
    url,
    async info() {
      const url = api.url.join('/');
      const raw = await client.get(url);
      const res = await Http.toResponse<t.RootResponse>(raw);
      return res;
    },
    subhosting: {
      async info() {
        const url = api.url.join('/subhosting');
        const raw = await client.get(url);
        const res = await Http.toResponse<t.SubhostingInfo>(raw);
        return res;
      },
      async projects() {
        const url = api.url.join('/subhosting/projects');
        const raw = await client.get(url);
        const res = await Http.toResponse<t.SubhostingProjectsInfo>(raw);
        return res;
      },
    },
  };
  return api;
};
