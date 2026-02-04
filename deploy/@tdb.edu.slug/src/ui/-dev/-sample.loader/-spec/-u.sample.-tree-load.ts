import { type t, SlugClient } from './-common.ts';

export const SampleTree: t.FetchSample = {
  label: 'FromEndpoint.Tree.load',

  /**
   * Load slug-tree manifest.
   */
  async run(e) {
    if (!e.baseUrl || !e.docid) {
      return e.result({ ok: false, error: { kind: 'schema', message: 'Missing baseUrl/docid.' } });
    }
    const res = await SlugClient.FromEndpoint.Tree.load(e.baseUrl, e.docid, {
      layout: { manifestsDir: e.manifestsDir },
    });
    e.result(res);
  },
};
