import { DESCRIPTOR } from '../-CONST.ts';
import { selectOrFirst } from './-u.selection.ts';
import { renderTreePlaybackAssetsCard } from './-ui.tree+playback-assets.card.tsx';
import { type t, PlaybackDriver } from './common.ts';

type Params = { kind: t.BundleDescriptorKind };
const ENSURE_IDS = ['2esGLgD5SoQkeucytmGeadm9cC7y'] as const;

export const TreePlaybackAssets: t.ActionProbe.ProbeSpec<t.TEnv, Params> = {
  title: 'ƒ • Fetch ← (Tree + (Playback + Assets))',
  render(e) {
    const kind: t.BundleDescriptorKind = 'slug-tree:media:seq';
    const descriptorPath = DESCRIPTOR.TARGET.media.descriptorPath;

    e.params({ kind });
    renderTreePlaybackAssetsCard(e, {
      refs: e.probe?.treePlayback?.refs,
      ensureRefs: [...ENSURE_IDS],
      selected: e.probe?.treePlayback?.ref,
      totalVisible: e.probe?.selectionList?.totalVisible,
      onSelect: e.probe?.treePlayback?.onRefChange,
    });
    e.hr();
    e.item({ k: 'kind', v: kind });
    e.item({ k: 'path', v: descriptorPath });
  },

  async run(e) {
    e.obj({ expand: { paths: ['$'] } });

    const params = e.params<Params>();
    const kind = params?.kind;

    if (!kind) {
      return e.result({
        ok: false,
        error: { message: 'Missing required params for tree/playback/assets load (kind).' },
      });
    }

    const docids = await DESCRIPTOR.media.docids(e.origin.cdn.default);
    if (!docids.ok) return e.result(docids);
    const ids = docids.value;
    e.probe?.treePlayback?.onRefsChange?.(ids);
    const selectedDocid = selectOrFirst(e.probe?.treePlayback?.ref, ids);
    e.item({ k: 'ids: loaded', v: ids.length });
    if (!selectedDocid) {
      return e.result({
        ok: true,
        value: {
          kind,
          descriptor: { docids: ids.length },
        },
        'value:descriptor': { docids: ids.length },
      });
    }
    e.probe?.treePlayback?.onRefChange?.(selectedDocid);

    const client = await DESCRIPTOR.media.client({
      origin: e.origin,
      docid: selectedDocid,
    });
    if (!client.ok) return e.result(client);

    const assets = await client.value.Timeline.Assets.load();
    if (!assets.ok) return e.result(assets);

    const playback = await client.value.Timeline.Playback.load();
    if (!playback.ok) return e.result(playback);

    /** Sample (Proof): first video URL. */
    const firstBeatUrl = toFirstBeatVideoHref({
      playback: playback.value,
      assets: assets.value.assets,
    });
    console.info('firstBeatUrl:', firstBeatUrl);

    e.item({ k: 'origin', v: e.origin.cdn.default });
    e.item({ k: 'basePath', v: DESCRIPTOR.TARGET.media.basePath });
    e.item({ k: 'docid', v: client.value.docid });
    e.hr();
    e.item({ k: 'descriptor: loaded', v: 'yes' });
    e.item({ k: 'assets', v: assets.value.assets.length });
    e.item({ k: 'playback: beats', v: playback.value.beats.length });
    e.item({
      k: 'first-beat:video',
      v: firstBeatUrl || '(none: unresolved)',
      href: firstBeatUrl ? { v: { infer: true, display: 'trim-http' } } : undefined,
    });
    e.item({ k: 'tree / bundle', v: 'skipped (manifest-only proof)' });

    return e.result({
      ok: true,
      value: {
        kind,
        docid: client.value.docid,
        descriptor: { docids: ids.length },
        assets: assets.value,
        playback: playback.value,
      },
      'value:descriptor': { docids: ids.length },
      [`value:assets:docid:${last(client.value.docid, 5)}`]: assets.value.assets,
      [`value:playback:docid:${last(client.value.docid, 5)}`]: playback.value,
    });
  },
};

/**
 * Helpers
 */

function last(input: string, count: number): string {
  return input.slice(Math.max(0, input.length - count));
}

function toFirstBeatVideoHref(args: {
  playback: t.SpecTimelineManifest;
  assets: readonly t.SpecTimelineAsset[];
}): string | undefined {
  const bundle = toBundle(args.playback, args.assets);
  if (!bundle) return undefined;
  return PlaybackDriver.Util.resolveBeatMedia(bundle)(0)?.src;
}

function toBundle(
  playback: t.SpecTimelineManifest | undefined,
  assets: readonly t.SpecTimelineAsset[] | undefined,
): t.SpecTimelineBundle | undefined {
  if (!playback) return undefined;
  const table = new Map<string, t.SpecTimelineAsset>();
  for (const item of assets ?? []) {
    table.set(`${item.kind}:${item.logicalPath}`, item);
  }
  return {
    docid: playback.docid,
    spec: {
      composition: playback.composition,
      beats: playback.beats,
    },
    resolveAsset(args) {
      return table.get(`${args.kind}:${args.logicalPath}`);
    },
  };
}
