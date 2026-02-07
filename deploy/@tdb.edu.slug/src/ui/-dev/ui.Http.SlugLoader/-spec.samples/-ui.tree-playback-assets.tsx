import { type t, SlugLoader } from './common.ts';

type Params = {
  kind: t.BundleDescriptorKind;
};

export const TreePlaybackAssets: t.ActionProbe.ProbeSpec<t.TEnv, Params> = {
  title: 'Tree + Playback + Assets',
  render(e) {
    const kind: t.BundleDescriptorKind = 'slug-tree:media:seq';
    const target = SlugLoader.Descriptor.target(kind);
    const descriptorPath = target.ok ? target.value.descriptorPath : '(unknown)';

    e.params({ kind });
    e.element(<div>Loads media descriptor, assets, and playback manifests for one docid.</div>);
    e.item({ k: 'kind', v: kind });
    e.item({ k: 'path', v: descriptorPath });
  },

  async run(e) {
    e.obj({ expand: { paths: ['$', '$.value'] } });

    const params = e.params<Params>();
    const kind = params?.kind;

    if (!kind) {
      return e.result({
        ok: false,
        error: { message: 'Missing required params for tree/playback/assets load (kind).' },
      });
    }

    const descriptor = await SlugLoader.Descriptor.load(e.origin.cdn.default, kind);
    if (!descriptor.ok) return e.result(descriptor);

    const client = await SlugLoader.Descriptor.client({
      origin: e.origin.cdn.default,
      kind,
    });
    if (!client.ok) return e.result(client);
    const target = SlugLoader.Descriptor.target(kind);
    if (!target.ok) return e.result(target);

    const assets = await client.value.Timeline.Assets.load();
    if (!assets.ok) return e.result(assets);

    const playback = await client.value.Timeline.Playback.load();
    if (!playback.ok) return e.result(playback);

    e.item({ k: 'origin', v: e.origin.cdn.default });
    e.item({ k: 'basePath', v: target.value.basePath });
    e.item({ k: 'docid', v: client.value.docid });
    e.item({ kind: 'hr' });
    e.item({ k: 'descriptor: loaded', v: 'yes' });
    e.item({ k: 'assets', v: assets.value.assets.length });
    e.item({ k: 'playback: beats', v: playback.value.beats.length });
    e.item({ k: 'tree/bundle', v: 'skipped (manifest-only proof)' });

    return e.result({
      ok: true,
      value: {
        kind,
        docid: client.value.docid,
        descriptor: { bundles: descriptor.value.bundles.length },
        assets: assets.value,
        playback: playback.value,
      },
    });
  },
};
