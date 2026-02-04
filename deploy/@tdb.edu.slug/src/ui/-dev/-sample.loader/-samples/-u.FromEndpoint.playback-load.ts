import { type t, SlugClient, Url } from './-common.ts';

export const SamplePlayback: t.FetchSample = {
  label: 'FromEndpoint.Playback.load',

  /**
   * Load playback manifest.
   */
  async run(e) {
    const basePath = e.is.local ? 'staging/cdn.slc.db.team/kb' : 'kb';
    const manifestsDir = '-manifests';
    const origin = e.origin.cdn.default;
    const descriptor = await SlugClient.FromEndpoint.Descriptor.load(
      origin,
      `${basePath}/${manifestsDir}`,
    );
    if (!descriptor.ok) return e.result(descriptor);
    const docid = descriptor.value.bundles[0]?.docid;
    if (!docid) {
      return e.result({
        ok: false,
        error: { kind: 'schema', message: 'Missing docid in descriptor.' },
      });
    }

    const baseUrl = Url.parse(origin).join(basePath);
    const Playback = SlugClient.FromEndpoint.Playback;
    const res = await Playback.load(baseUrl, docid, { layout: { manifestsDir } });
    e.result(res);
  },
};
