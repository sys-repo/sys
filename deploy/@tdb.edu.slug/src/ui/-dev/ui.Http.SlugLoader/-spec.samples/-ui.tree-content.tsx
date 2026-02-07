import { type t, SlugLoader, Str } from './common.ts';
import { renderTreeContentCard } from './-ui.tree-content.card.tsx';

type Params = {
  kind: t.BundleDescriptorKind;
};

export const TreeContent: t.ActionProbe.ProbeSpec<t.TEnv, Params> = {
  title: 'Tree + Content',
  render(e) {
    const kind: t.BundleDescriptorKind = 'slug-tree:fs';

    e.params({ kind });
    renderTreeContentCard(e, {
      refs: e.probe?.treeContent?.refs,
      selected: e.probe?.treeContent?.ref,
      onSelect: e.probe?.treeContent?.onRefChange,
    });
    e.item({ k: 'kind', v: kind });
    e.item({ kind: 'hr' });
  },

  async run(e) {
    e.obj({ expand: { paths: ['$', '$.value'] } });

    const params = e.params<Params>();
    const kind = params?.kind;

    if (!kind) {
      return e.result({
        ok: false,
        error: { message: 'Missing required params for tree/content load (kind).' },
      });
    }

    const client = await SlugLoader.Descriptor.client({
      origin: e.origin.cdn.default,
      kind,
    });
    if (!client.ok) return e.result(client);

    const docid = client.value.docid;
    const baseUrl = client.value.baseUrl;
    e.item({ k: 'origin', v: e.origin.cdn.default });
    e.item({ k: 'base-url', v: baseUrl });
    e.item({ k: 'doc-id', v: docid });
    const tree = await client.value.Tree.load();
    if (!tree.ok) return e.result(tree);

    const refs = findRefs(tree.value.tree, 3);
    e.probe?.treeContent?.onRefsChange?.(refs);
    const ref = resolveRef(e.probe?.treeContent?.ref, refs);
    if (!ref) {
      return e.result({
        ok: false,
        error: { kind: 'schema', message: 'No ref found in slug-tree.' },
      });
    }
    e.probe?.treeContent?.onRefChange?.(ref);

    const index = await client.value.FileContent.index();
    if (!index.ok) return e.result(index);

    const hash = findHash(index.value.entries, ref);
    if (!hash) {
      return e.result({
        ok: false,
        error: { kind: 'schema', message: `No content hash found for ref: ${ref}` },
      });
    }

    const content = await client.value.FileContent.get(hash);
    if (!content.ok) return e.result(content);
    const frontmatter = content.value.frontmatter;
    e.item({ k: 'ref', v: ref });
    e.item({ k: 'hash', v: Str.ellipsize(hash, [20, 5], '..') });
    e.item({ k: 'content-type', v: content.value.contentType });
    e.item({ kind: 'hr' });
    e.item({ k: 'content/frontmatter:', v: frontmatter ? 'yes' : 'no' });
    e.item({ k: 'title', v: frontmatter?.title ?? '(none)' });
    e.item({ k: 'refs: loaded', v: refs.length });
    e.item({ k: 'tree: items', v: tree.value.tree.length });
    e.item({ k: 'content-index: entries', v: index.value.entries.length });

    return e.result({
      ok: true,
      value: {
        docid,
        ref,
        hash,
        tree: tree.value,
        content: content.value,
        contentIndex: index.value,
      },
    });
  },
};

function findRefs(tree: readonly t.SlugTreeItem[], total = 3): string[] {
  const refs: string[] = [];
  for (const item of tree) {
    if (refs.length >= total) break;
    const ref = (item as { ref?: unknown }).ref;
    if (typeof ref === 'string' && ref.length > 0) refs.push(ref);

    const slugs = (item as { slugs?: readonly t.SlugTreeItem[] }).slugs;
    if (Array.isArray(slugs) && refs.length < total) {
      const remaining = total - refs.length;
      refs.push(...findRefs(slugs, remaining));
    }
  }
  return refs.filter((item, index, all) => all.indexOf(item) === index).slice(0, total);
}

function resolveRef(selected: string | undefined, refs: string[]): string | undefined {
  if (selected && refs.includes(selected)) return selected;
  return refs[0];
}

function findHash(entries: readonly t.SlugFileContentEntry[], ref: string): string | undefined {
  const entry = entries.find((item) => item.frontmatter?.ref === ref || item.path === ref);
  return entry?.hash;
}
