import { type t, SlugClient, Url } from './common.ts';

type Params = {
  basePath: string;
  docid: string;
  manifestsDir: string;
  contentDir: string;
};

export const TreeContent: t.ActionProbe.ProbeSpec<t.TEnv, Params> = {
  title: 'Tree + Content',
  render(e) {
    const basePath = 'kb';
    const docid = 'kb';
    const manifestsDir = '-manifests';
    const contentDir = 'content';

    e.params({ basePath, docid, manifestsDir, contentDir });
    e.element(
      <div>
        Loads tree, resolves one <code>ref</code>, then loads indexed file-content by hash.
      </div>,
    );
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

    const ref = findFirstRef(tree.value.tree);
    if (!ref) {
      return e.result({
        ok: false,
        error: { kind: 'schema', message: 'No ref found in slug-tree.' },
      });
    }

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
    e.item({ k: 'hash', v: hash });
    e.item({ k: 'contentType', v: content.value.contentType });
    e.item({ k: 'title', v: frontmatter?.title ?? '(none)' });
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

function findFirstRef(tree: readonly t.SlugTreeItem[]): string | undefined {
  for (const item of tree) {
    const ref = (item as { ref?: unknown }).ref;
    if (typeof ref === 'string' && ref.length > 0) return ref;

    const slugs = (item as { slugs?: readonly t.SlugTreeItem[] }).slugs;
    if (Array.isArray(slugs)) {
      const found = findFirstRef(slugs);
      if (found) return found;
    }
  }
  return undefined;
}

function findHash(entries: readonly t.SlugFileContentEntry[], ref: string): string | undefined {
  const entry = entries.find((item) => item.frontmatter?.ref === ref || item.path === ref);
  return entry?.hash;
}
