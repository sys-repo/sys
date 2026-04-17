import { renderTreePlaybackCard } from './-ui.tree+playback.card.tsx';
import { type t, DataClient, Str } from './common.ts';

type Params = {
  readonly kind: 'slug-tree:media:seq';
};

export const TreePlayback: t.ActionProbe.ProbeSpec<t.HttpDataCards.TEnv, Params> = {
  title: 'ƒ • Fetch ← (Tree + Playback)',
  render(e) {
    const kind: Params['kind'] = 'slug-tree:media:seq';
    e.params({ kind });
    renderTreePlaybackCard(e, {
      refs: e.probe?.treePlayback?.refs,
      selected: e.probe?.treePlayback?.ref,
      totalVisible: e.probe?.selectionList?.totalVisible,
      onSelect: e.probe?.treePlayback?.onRefChange,
    });
    e.hr();
    e.item({ k: 'kind', v: kind });
  },

  async run(e) {
    e.obj({ expand: { paths: ['$'] } });

    const client = DataClient.fromDataset({
      origin: e.origin,
      dataset: e.dataset,
      docid: e.docid,
    });

    e.item({ k: 'origin', v: e.origin });
    e.item({ k: 'base-url', v: client.baseUrl });
    e.item({ k: 'doc-id', v: client.docid });

    const tree = await client.Tree.load();
    if (!tree.ok) return e.result(tree);

    const refs = DataClient.refsFromTree(tree.value.tree);
    e.probe?.treePlayback?.onRefsChange?.(refs);
    e.item({ k: 'refs: loaded', v: refs.length });
    e.item({ k: 'tree: items', v: tree.value.tree.length });

    const ref = DataClient.selectOrFirst(e.probe?.treePlayback?.ref, refs);
    if (!ref) {
      return e.result({
        ok: true,
        value: {
          tree: tree.value,
          refs,
        },
        'value:tree': tree.value,
      });
    }
    e.probe?.treePlayback?.onRefChange?.(ref);

    const playbackClient = DataClient.create({
      baseUrl: client.baseUrl,
      docid: ref as t.StringId,
      layout: client.layout,
    });
    const playback = await playbackClient.Timeline.Playback.load();
    if (!playback.ok) return e.result(playback);

    const composition = playback.value.composition;
    const beats = playback.value.beats;
    const titles = beats
      .map((beat) => {
        const payload = beat.payload as { title?: unknown } | undefined;
        return payload?.title;
      })
      .filter((value): value is string => typeof value === 'string' && value.trim().length > 0);

    e.item({ k: 'ref', v: ref });
    e.item({ k: 'playback: composition', v: composition.length });
    e.item({ k: 'playback: beats', v: beats.length });
    e.item({
      k: 'playback: first-src',
      v: composition[0]?.src ? Str.ellipsize(String(composition[0].src), [28, 14], '..') : '(none)',
    });
    e.item({ k: 'playback: titles', v: titles.length });

    return e.result({
      ok: true,
      value: {
        tree: tree.value,
        refs,
        ref,
        playback: playback.value,
      },
      'value:tree': tree.value,
      [`value:playback:ref:${last(ref, 5)}`]: playback.value,
    });
  },
};

function last(input: string, count: number): string {
  return input.slice(Math.max(0, input.length - count));
}
