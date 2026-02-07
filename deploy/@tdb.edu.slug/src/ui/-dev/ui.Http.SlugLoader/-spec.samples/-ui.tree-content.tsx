import { type t, Str, SlugClient, Url } from './common.ts';
import { renderTreeContentCard } from './-ui.tree-content.card.tsx';

type Params = t.TreeContentParams;

export const TreeContent: t.ActionProbe.ProbeSpec<t.TEnv, Params> = {
  title: 'Tree + Content',
  render(e) {
    const basePath = 'kb';
    const docid = 'kb';
    const manifestsDir = '-manifests';
    const contentDir = 'content';

    e.params({ basePath, docid, manifestsDir, contentDir });
    renderTreeContentCard(e, {
      refs: e.probe?.treeContent?.refs,
      selected: e.probe?.treeContent?.ref,
      onSelect: e.probe?.treeContent?.onRefChange,
    });
    e.item({ k: 'basePath', v: basePath });
    e.item({ k: 'docid', v: docid });
  },

  async run(e) {
    e.obj({ expand: { paths: ['$', '$.value'] } });

    const params = e.params<Params>();
    const basePath = params?.basePath;
    const docid = params?.docid;
    const manifestsDir = params?.manifestsDir;
    const contentDir = params?.contentDir;

    if (!basePath || !docid || !manifestsDir || !contentDir) {
      return e.result({
        ok: false,
        error: { message: 'Missing required params for tree/content load.' },
      });
    }

    const baseUrl = Url.parse(e.origin.cdn.default).join(basePath);
    e.item({ k: 'origin', v: e.origin.cdn.default });
    e.item({ k: 'baseUrl', v: baseUrl });
    const tree = await SlugClient.FromEndpoint.Tree.load(baseUrl, docid, {
      layout: { manifestsDir },
    });
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

    const index = await SlugClient.FromEndpoint.FileContent.index(baseUrl, docid, {
      layout: { manifestsDir },
    });
    if (!index.ok) return e.result(index);

    const hash = findHash(index.value.entries, ref);
    if (!hash) {
      return e.result({
        ok: false,
        error: { kind: 'schema', message: `No content hash found for ref: ${ref}` },
      });
    }

    const content = await SlugClient.FromEndpoint.FileContent.get(baseUrl, hash, {
      layout: { contentDir },
    });
    if (!content.ok) return e.result(content);
    const frontmatter = content.value.frontmatter;
    e.item({ k: 'ref', v: ref });
    e.item({ k: 'hash', v: Str.ellipsize(hash, [20, 5], '..') });
    e.item({ k: 'contentType', v: content.value.contentType });
    e.item({ kind: 'hr' });
    e.item({ k: 'title', v: frontmatter?.title ?? '(none)' });
    e.item({ k: 'refs.loaded', v: refs.length });
    e.item({ k: 'tree.items', v: tree.value.tree.length });
    e.item({ k: 'contentIndex.entries', v: index.value.entries.length });

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
