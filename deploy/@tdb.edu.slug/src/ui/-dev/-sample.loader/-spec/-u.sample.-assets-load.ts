import { type t, SlugClient } from './-common.ts';

export const SampleAssets: t.FetchSample = {
  label: 'FromEndpoint.Assets.load',

  /**
   * Load assets manifest.
   */
  async run(e) {
    if (!e.baseUrl || !e.docid) {
      return e.result({ ok: false, error: { kind: 'schema', message: 'Missing baseUrl/docid.' } });
    }
    const res = await SlugClient.FromEndpoint.Assets.load(e.baseUrl, e.docid, {
      layout: { manifestsDir: e.manifestsDir },
    });
    e.result(res);
  },
};
