import { type t, SlugLoader } from './common.ts';
import { renderTreePlaybackAssetsCard } from './-ui.tree-playback-assets.card.tsx';

type Params = {
  kind: t.BundleDescriptorKind;
};

export const TreePlaybackAssets: t.ActionProbe.ProbeSpec<t.TEnv, Params> = {
  title: 'Tree + (Playback + Assets)',
  render(e) {
    const kind: t.BundleDescriptorKind = 'slug-tree:media:seq';
    const target = SlugLoader.Descriptor.target(kind);
    const descriptorPath = target.ok ? target.value.descriptorPath : '(unknown)';

    e.params({ kind });
    renderTreePlaybackAssetsCard(e, {
      refs: e.probe?.treePlayback?.refs,
      selected: e.probe?.treePlayback?.ref,
      onSelect: e.probe?.treePlayback?.onRefChange,
    });
    e.hr();
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

    const ids = findDocids(descriptor.value, kind, 3);
    e.probe?.treePlayback?.onRefsChange?.(ids);
    const selectedDocid = resolveId(e.probe?.treePlayback?.ref, ids);
    if (!selectedDocid) {
      return e.result({
        ok: false,
        error: { kind: 'schema', message: `No descriptor docid found for kind: ${kind}` },
      });
    }
    e.probe?.treePlayback?.onRefChange?.(selectedDocid);

    const client = await SlugLoader.Descriptor.client({
      origin: e.origin.cdn.default,
      kind,
      docid: selectedDocid,
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
    e.item({ k: 'ids: loaded', v: ids.length });
    e.hr();
    e.item({ k: 'descriptor: loaded', v: 'yes' });
    e.item({ k: 'assets', v: assets.value.assets.length });
    e.item({ k: 'playback: beats', v: playback.value.beats.length });
    e.item({ k: 'tree / bundle', v: 'skipped (manifest-only proof)' });

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

function findDocids(
  descriptor: t.BundleDescriptorDoc,
  kind: t.BundleDescriptorKind,
  total = 3,
): string[] {
  const ids = descriptor.bundles
    .filter((item) => item.kind === kind)
    .map((item) => item.docid)
    .filter((item, index, all) => all.indexOf(item) === index);
  return ids.slice(0, total);
}

function resolveId(selected: string | undefined, ids: string[]): string | undefined {
  if (selected && ids.includes(selected)) return selected;
  return ids[0];
}
