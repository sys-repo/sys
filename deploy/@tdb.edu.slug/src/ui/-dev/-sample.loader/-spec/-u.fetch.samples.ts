import { type DebugSignals, type t, Url } from './-common.ts';
import { fetchButton } from './-u.fetch.btn.tsx';

/** Samples */
import { sampleAssetsLoad } from './-u.sample.-assets-load.ts';
import { sampleBundleLoad } from './-u.sample.-bundle-load.ts';
import { sampleDescriptorLoad } from './-u.sample.-descriptor-load.ts';
import { sampleFileContentGet } from './-u.sample.-filecontent-get.ts';
import { samplePlaybackLoad } from './-u.sample.-playback-load.ts';
import { sampleTreeLoad } from './-u.sample.-tree-load.ts';

export function fetchSamples(debug: DebugSignals) {
  const items: t.ReactNode[] = [];
  const btn = (label: string, fn: t.FetchAction) => {
    const i = items.length - 1;
    items.push(fetchButton(debug, label, fn, i));
  };
  const response = () => debug.props.response.value as any;
  const responseValue = () => {
    const current = response();
    return current?.value ?? current;
  };
  const resolveDocid = () => {
    const current = responseValue();
    if (typeof current?.docid === 'string') return current.docid;
    if (Array.isArray(current?.bundles)) return current.bundles[0]?.docid;
    return undefined;
  };
  const resolveHash = () => {
    const current = responseValue();
    if (typeof current?.hash === 'string') return current.hash;
    if (Array.isArray(current?.entries)) return current.entries[0]?.hash;
    return undefined;
  };
  const base = (e: { local: boolean; origin: t.SlugLoaderOrigin }) => {
    const basePath = e.local ? 'staging/cdn.slc.db.team/kb' : 'kb';
    const manifestsDir = '-manifests';
    return {
      baseUrl: Url.parse(e.origin.cdn.default).join(basePath),
      manifestsDir,
    };
  };
  btn('FromEndpoint.Descriptor.load', sampleDescriptorLoad);

  const withDocid = (label: string, fn: (e: t.FetchActionArgs) => Promise<void>) =>
    btn(label, async (e) => {
      const docid = resolveDocid();
      if (!docid) {
        return e.result({
          ok: false,
          error: { kind: 'schema', message: 'Missing docid. Load descriptor first.' },
        });
      }
      const { baseUrl, manifestsDir } = base(e);
      await fn({ ...e, docid, baseUrl, manifestsDir });
    });

  withDocid('FromEndpoint.Tree.load', sampleTreeLoad);
  withDocid('FromEndpoint.Playback.load', samplePlaybackLoad);
  withDocid('FromEndpoint.Assets.load', sampleAssetsLoad);
  withDocid('FromEndpoint.Bundle.load', sampleBundleLoad);

  btn('FromEndpoint.FileContent.get', async (e) => {
    const hash = resolveHash();
    if (!hash) {
      return e.result({
        ok: false,
        error: { kind: 'schema', message: 'Missing hash. Load file-content index first.' },
      });
    }
    const { baseUrl } = base(e);
    await sampleFileContentGet({ ...e, hash, baseUrl });
  });

  return items;
}
