import { type t, SlugClient, Url } from './common.ts';

type Params = {
  descriptorPath: string;
  kind: t.BundleDescriptorKind;
};

export const TreePlaybackAssets: t.ActionProbe.ProbeSpec<t.TEnv, Params> = {
  title: 'Tree + Playback + Assets',
  render(e) {
    const descriptorPath = 'program/-manifests';
    const kind: t.BundleDescriptorKind = 'slug-tree:media:seq';

    e.params({ descriptorPath, kind });
    e.element(<div>Loads media descriptor, assets, and playback manifests for one docid.</div>);
    e.item({ k: 'kind', v: kind });
    e.item({ k: 'path', v: descriptorPath });
  },

  async run(e) {
    e.obj({ expand: { paths: ['$', '$.value'] } });

    const params = e.params<Params>();
    const descriptorPath = params?.descriptorPath;
    const kind = params?.kind;

    if (!descriptorPath || !kind) {
      return e.result({
        ok: false,
        error: { message: 'Missing required params for tree/playback/assets load (path/kind).' },
      });
    }

    const descriptor = await SlugClient.FromEndpoint.Descriptor.load(
      e.origin.cdn.default,
      descriptorPath,
    );
    if (!descriptor.ok) return e.result(descriptor);

    const selected = descriptor.value.bundles.find((item) => item.kind === kind);
    const docid = selected?.docid;
    if (!docid) {
      return e.result({
        ok: false,
        error: {
          kind: 'schema',
          message: `No descriptor bundle found for kind: ${kind}`,
        },
      });
    }

    const basePath = descriptorPath.replace(/\/-manifests$/, '');
    const client = SlugClient.FromDescriptor.make({
      descriptor: descriptor.value,
      baseUrl: Url.parse(e.origin.cdn.default).join(basePath),
      kind,
      docid,
    });
    if (!client.ok) return e.result(client);

    const assets = await client.value.Timeline.Assets.load();
    if (!assets.ok) return e.result(assets);

    const playback = await client.value.Timeline.Playback.load();
    if (!playback.ok) return e.result(playback);

    e.item({ k: 'origin', v: e.origin.cdn.default });
    e.item({ k: 'basePath', v: basePath });
    e.item({ k: 'docid', v: docid });
    e.item({ kind: 'hr' });
    e.item({ k: 'descriptor: loaded', v: 'yes' });
    e.item({ k: 'assets', v: assets.value.assets.length });
    e.item({ k: 'playback: beats', v: playback.value.beats.length });
    e.item({ k: 'tree/bundle', v: 'skipped (manifest-only proof)' });

    return e.result({
      ok: true,
      value: {
        kind,
        docid,
        descriptor: { bundles: descriptor.value.bundles.length },
        assets: assets.value,
        playback: playback.value,
      },
    });
  },
};
