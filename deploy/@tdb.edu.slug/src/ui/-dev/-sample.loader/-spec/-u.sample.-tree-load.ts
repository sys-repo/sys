import { type t, SlugClient } from './-common.ts';

/**
 * Load slug-tree manifest.
 */
export async function sampleTreeLoad(e: t.FetchActionArgs) {
  if (!e.baseUrl || !e.docid) {
    return e.result({ ok: false, error: { kind: 'schema', message: 'Missing baseUrl/docid.' } });
  }
  const res = await SlugClient.FromEndpoint.Tree.load(e.baseUrl, e.docid, {
    layout: { manifestsDir: e.manifestsDir },
  });
  e.result(res);
}
