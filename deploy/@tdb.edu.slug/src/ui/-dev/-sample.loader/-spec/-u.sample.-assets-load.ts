import { type FetchActionArgs, SlugClient } from './-common.ts';

/**
 * Load assets manifest.
 */
export async function sampleAssetsLoad(e: FetchActionArgs) {
  if (!e.baseUrl || !e.docid) {
    return e.result({ ok: false, error: { kind: 'schema', message: 'Missing baseUrl/docid.' } });
  }
  const res = await SlugClient.FromEndpoint.Assets.load(e.baseUrl, e.docid, {
    layout: { manifestsDir: e.manifestsDir },
  });
  e.result(res);
}
