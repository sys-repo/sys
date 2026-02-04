import { type FetchActionArgs, SlugClient } from './-common.ts';

/**
 * Load file-content by hash.
 */
export async function sampleFileContentGet(e: FetchActionArgs) {
  if (!e.baseUrl || !e.hash) {
    return e.result({ ok: false, error: { kind: 'schema', message: 'Missing baseUrl/hash.' } });
  }
  const res = await SlugClient.FromEndpoint.FileContent.get(e.baseUrl, e.hash);
  e.result(res);
}
