import { type t, SlugClient, Url } from './-common.ts';

export const SampleTree: t.FetchSample = {
  label: 'FromEndpoint.Tree.load',

  /**
   * Load slug-tree manifest.
   */
  async run(e) {
    const basePath = e.is.local ? 'staging/slc.cdn/kb' : 'kb';
    const origin = e.origin.cdn.default;
    const manifestsDir = '-manifests';
    const manifestsPath = `${basePath}/${manifestsDir}`;

    const descriptor = await SlugClient.FromEndpoint.Descriptor.load(origin, manifestsPath);
    if (!descriptor.ok) return e.result(descriptor);

    console.log('descriptor', descriptor);

    // const docid = descriptor.value.bundles[0]?.docid;
    const docid = 'kb';
    if (!docid) {
      return e.result({
        ok: false,
        error: { kind: 'schema', message: 'Missing docid in descriptor.' },
      });
    }
    const baseUrl = Url.parse(origin).join(basePath);
    const res = await SlugClient.FromEndpoint.Tree.load(baseUrl, docid, {
      layout: { manifestsDir },
    });
    e.result(res);
  },
};
