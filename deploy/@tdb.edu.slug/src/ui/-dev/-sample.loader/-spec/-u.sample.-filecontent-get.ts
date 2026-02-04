import { type t, SlugClient } from './-common.ts';

export const SampleFileContentGet: t.FetchSample = {
  label: 'FromEndpoint.FileContent.get',

  /**
   * Load file-content by hash.
   */
  async run(e) {
    if (!e.baseUrl || !e.hash) {
      return e.result({ ok: false, error: { kind: 'schema', message: 'Missing baseUrl/hash.' } });
    }
    const res = await SlugClient.FromEndpoint.FileContent.get(e.baseUrl, e.hash);
    e.result(res);
  },
};
