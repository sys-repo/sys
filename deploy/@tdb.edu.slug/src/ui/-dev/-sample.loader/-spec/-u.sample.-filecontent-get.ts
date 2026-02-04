import { type t, SlugClient, Url } from './-common.ts';

export const SampleFileContentGet: t.FetchSample = {
  label: 'FromEndpoint.FileContent.get',

  /**
   * Load file-content by hash.
   */
  async run(e) {
    const basePath = e.local ? 'staging/cdn.slc.db.team/kb' : 'kb';
    const manifestsDir = '-manifests';
    const origin = e.origin.cdn.default;
    const descriptor = await SlugClient.FromEndpoint.Descriptor.load(
      origin,
      `${basePath}/${manifestsDir}`,
    );
    if (!descriptor.ok) return e.result(descriptor);
    const docid = descriptor.value.bundles[0]?.docid;
    if (!docid) {
      return e.result({ ok: false, error: { kind: 'schema', message: 'Missing docid in descriptor.' } });
    }
    const baseUrl = Url.parse(origin).join(basePath);
    const index = await SlugClient.FromEndpoint.FileContent.index(baseUrl, docid, {
      layout: { manifestsDir },
    });
    if (!index.ok) return e.result(index);
    const hash = index.value.entries[0]?.hash;
    if (!hash) {
      return e.result({ ok: false, error: { kind: 'schema', message: 'Missing hash in file-content index.' } });
    }
    const res = await SlugClient.FromEndpoint.FileContent.get(baseUrl, hash);
    e.result(res);
  },
};
