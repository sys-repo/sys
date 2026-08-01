import { Fetch, type t } from './common.ts';

const MAX_METADATA_BYTES = 64 * 1024 * 1024;
const REGISTRY_ORIGIN = 'https://registry.npmjs.org';

/** Fetch one NPM metadata resource through an owner-bounded capability. */
export async function fetchJson<T>(
  url: t.StringUrl,
  init: t.HttpFetch.Init,
  until?: t.UntilInput,
): Promise<t.HttpFetch.Response<T>> {
  const client = Fetch.make({
    until,
    policy: {
      maxBytes: MAX_METADATA_BYTES,
      timeout: 30_000,
      maxRedirects: 3,
      progressInterval: 100,
      sourceOrigins: [REGISTRY_ORIGIN],
      credentialOrigins: [],
    },
  });

  try {
    return await client.json<T>(url, init);
  } finally {
    client.dispose();
  }
}
