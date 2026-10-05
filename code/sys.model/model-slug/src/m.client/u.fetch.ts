import { Http, type t } from './common.ts';

/** Fetch one Slug JSON resource through explicit bounded transport authority. */
export async function fetchJson<T>(
  url: t.StringUrl,
  init: t.HttpFetch.Init,
  transport: t.SlugLoadTransport,
): Promise<t.HttpFetch.Response<T>> {
  const ownsClient = !transport.client;
  const client = transport.client ?? Http.fetcher({ policy: transport.policy });

  try {
    return await client.json<T>(url, init);
  } finally {
    if (ownsClient) client.dispose();
  }
}
