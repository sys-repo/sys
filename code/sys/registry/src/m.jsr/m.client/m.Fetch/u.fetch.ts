import { Fetch, type t } from './common.ts';

const MAX_RESPONSE_BYTES = 64 * 1024 * 1024;
const JSR_ORIGIN = 'https://jsr.io';

function make(until?: t.UntilInput): t.HttpFetch.Instance {
  return Fetch.make({
    policy: {
      maxBytes: MAX_RESPONSE_BYTES,
      timeout: 30_000,
      maxRedirects: 3,
      progressInterval: 100,
      sourceOrigins: [JSR_ORIGIN],
      credentialOrigins: [JSR_ORIGIN],
    },
    until,
  });
}

export async function fetchJson<T>(
  url: t.StringUrl,
  init: t.HttpFetch.Init,
  until?: t.UntilInput,
): Promise<t.HttpFetch.Response<T>> {
  const client = make(until);
  try {
    return await client.json<T>(url, init);
  } finally {
    client.dispose();
  }
}

export async function fetchText(
  url: t.StringUrl,
  options: t.HttpFetch.Options,
  until?: t.UntilInput,
): Promise<t.HttpFetch.Response<string>> {
  const client = make(until);
  try {
    return await client.text(url, {}, options);
  } finally {
    client.dispose();
  }
}
