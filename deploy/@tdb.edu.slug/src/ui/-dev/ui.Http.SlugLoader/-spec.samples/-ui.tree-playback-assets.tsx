import { type t, SlugClient, Url } from './common.ts';

type Params = {
  basePath: string;
  docid: string;
  manifestsDir: string;
};

export const TreePlaybackAssets: t.ActionProbe.ProbeSpec<t.TEnv, Params> = {
  title: 'Tree + Playback + Assets',
  render(e) {
    const basePath = 'kb';
    const docid = 'kb';
    const manifestsDir = '-manifests';

    e.params({ basePath, docid, manifestsDir });
    e.element(
      <div>
        Loads tree, assets, playback, and timeline bundle for one docid.
      </div>,
    );
    e.item({ k: 'basePath', v: basePath });
    e.item({ k: 'docid', v: docid });
  },

  async run(e) {
    const params = e.params<Params>();
    const basePath = params?.basePath;
    const docid = params?.docid;
    const manifestsDir = params?.manifestsDir;

    if (!basePath || !docid || !manifestsDir) {
      return e.result({
        ok: false,
        error: { message: 'Missing required params for tree/playback/assets load.' },
      });
    }

    const baseUrl = Url.parse(e.origin.cdn.default).join(basePath);
    const options: t.SlugLoadOptions = { layout: { manifestsDir } };

    const tree = await SlugClient.FromEndpoint.Tree.load(baseUrl, docid, options);
    if (!tree.ok) return e.result(tree);

    const assets = await SlugClient.FromEndpoint.Timeline.Assets.load(baseUrl, docid, options);
    if (!assets.ok) return e.result(assets);

    const playback = await SlugClient.FromEndpoint.Timeline.Playback.load(baseUrl, docid, options);
    if (!playback.ok) return e.result(playback);

    const bundle = await SlugClient.FromEndpoint.Timeline.Bundle.load(baseUrl, docid, options);
    if (!bundle.ok) return e.result(bundle);

    return e.result({
      ok: true,
      value: {
        docid,
        tree: tree.value,
        assets: assets.value,
        playback: playback.value,
        bundle: bundle.value,
      },
    });
  },
};
