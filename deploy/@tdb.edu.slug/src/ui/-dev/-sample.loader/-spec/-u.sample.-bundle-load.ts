import { type t, SlugClient } from './-common.ts';

export const SampleBundle: t.FetchSample = {
  label: 'FromEndpoint.Bundle.load',

  /**
   * Load bundle manifest.
   */
  async run(e) {
    if (!e.baseUrl || !e.docid) {
      return e.result({ ok: false, error: { kind: 'schema', message: 'Missing baseUrl/docid.' } });
    }
    const res = await SlugClient.FromEndpoint.Bundle.load(e.baseUrl, e.docid, {
      layout: { manifestsDir: e.manifestsDir },
    });
    e.result(res);
  },
};
