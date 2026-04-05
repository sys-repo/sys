import { type t, Is, Obj, SlcDataClient, Str } from './common.ts';
import { renderTreeContentCard } from './-ui.tree+file-content.card.tsx';

type Params = {
  readonly kind: 'slug-tree:fs';
};

export const TreeContent: t.ActionProbe.ProbeSpec<t.HttpDataCards.TEnv, Params> = {
  title: 'ƒ • Fetch ← (Tree + FileContent)',
  render(e) {
    const kind: Params['kind'] = 'slug-tree:fs';
    e.params({ kind });
    renderTreeContentCard(e, {
      refs: e.probe?.treeContent?.refs,
      selected: e.probe?.treeContent?.ref,
      totalVisible: e.probe?.selectionList?.totalVisible,
      onSelect: e.probe?.treeContent?.onRefChange,
    });
    e.hr();
    e.item({ k: 'kind', v: kind });
  },

  async run(e) {
    e.obj({ expand: { paths: ['$'] } });

    const client = SlcDataClient.fromDataset({
      origin: e.origin,
      dataset: e.dataset,
      docid: e.docid,
    });

    e.item({ k: 'origin', v: e.origin });
    e.item({ k: 'base-url', v: client.baseUrl });
    e.item({ k: 'doc-id', v: client.docid });

    const tree = await client.Tree.load();
    if (!tree.ok) return e.result(tree);

    const refs = SlcDataClient.refsFromTree(tree.value.tree);
    e.probe?.treeContent?.onRefsChange?.(refs);
    e.item({ k: 'refs: loaded', v: refs.length });
    e.item({ k: 'tree: items', v: tree.value.tree.length });

    const ref = SlcDataClient.selectOrFirst(e.probe?.treeContent?.ref, refs);
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
    e.probe?.treeContent?.onRefChange?.(ref);

    const contentIndex = await client.FileContent.index();
    if (!contentIndex.ok) return e.result(contentIndex);

    const hash = SlcDataClient.findHash(contentIndex.value.entries, ref);
    if (!hash) {
      return e.result({
        ok: false,
        error: { kind: 'schema', message: `No content hash found for ref: ${ref}` },
      });
    }

    const content = await client.FileContent.get(hash);
    if (!content.ok) return e.result(content);

    const frontmatter = content.value.frontmatter;
    e.item({ k: 'ref', v: ref });
    e.item({ k: 'hash', v: Str.ellipsize(hash, [20, 5], '..') });
    e.item({ k: 'content-type', v: content.value.contentType });
    e.hr();
    e.item({ k: 'title', v: frontmatter?.title ?? '(none)' });
    e.item({ k: 'content-index: entries', v: contentIndex.value.entries.length });
    e.item({ k: 'content-frontmatter: entries', v: totalKeys(frontmatter) });

    return e.result({
      ok: true,
      value: {
        tree: tree.value,
        refs,
        ref,
        hash,
        contentIndex: contentIndex.value,
        content: content.value,
      },
      'value:tree': tree.value,
      'value:content:index': contentIndex.value,
      [`value:content:ref:${last(ref, 5)}`]: content.value,
    });
  },
};

function totalKeys(input: unknown) {
  if (!Is.object(input)) return 0;
  const keys: string[] = [];
  Obj.walk(input, (e) => keys.push(String(e.key)));
  return keys.length;
}

function last(input: string, count: number): string {
  return input.slice(Math.max(0, input.length - count));
}
