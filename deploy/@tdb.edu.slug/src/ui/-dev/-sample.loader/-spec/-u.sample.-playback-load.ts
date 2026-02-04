import { type t, SlugClient } from './-common.ts';

/**
 * Load playback manifest.
 */
export async function samplePlaybackLoad(e: t.FetchActionArgs) {
  const { manifestsDir } = e;
  if (!e.baseUrl || !e.docid) {
    return e.result({ ok: false, error: { kind: 'schema', message: 'Missing baseUrl/docid.' } });
  }

  const Playback = SlugClient.FromEndpoint.Playback;
  const res = await Playback.load(e.baseUrl, e.docid, { layout: { manifestsDir } });
  e.result(res);
}
