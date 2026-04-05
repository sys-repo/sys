import { type t, Is, Num, SlugClient, Url } from './common.ts';

const DEFAULT_LAYOUT = {
  manifestsDir: 'manifests',
  contentDir: 'content',
} as const satisfies t.SlcDataClient.Layout;

export const SlcDataClient: t.SlcDataClient.Lib = {
  create,
  fromDataset,
  refsFromTree,
  findHash,
  selectOrFirst,
};

function create(args: t.SlcDataClient.CreateArgs): t.SlcDataClient.Client {
  const layout = { ...DEFAULT_LAYOUT, ...(args.layout ?? {}) } as const;
  const baseUrl = String(Url.parse(args.baseUrl).href) as t.StringUrl;
  const docid = String(args.docid).trim() as t.StringId;
  const options = { layout } as const;

  return {
    baseUrl,
    docid,
    layout,
    Tree: {
      load: () => SlugClient.FromEndpoint.Tree.load(baseUrl, docid, options),
    },
    FileContent: {
      index: () => SlugClient.FromEndpoint.FileContent.index(baseUrl, docid, options),
      get: (hash) => SlugClient.FromEndpoint.FileContent.get(baseUrl, hash, options),
    },
    TreeContent: {
      async load(input = {}) {
        const tree = await SlugClient.FromEndpoint.Tree.load(baseUrl, docid, options);
        if (!tree.ok) return tree;

        const refs = refsFromTree(tree.value.tree);
        const ref = selectOrFirst(input.ref, refs);
        if (!ref) {
          return {
            ok: true,
            value: { tree: tree.value, refs },
          };
        }

        const contentIndex = await SlugClient.FromEndpoint.FileContent.index(baseUrl, docid, options);
        if (!contentIndex.ok) return contentIndex;

        const hash = findHash(contentIndex.value.entries, ref);
        if (!hash) {
          return {
            ok: false,
            error: {
              kind: 'schema',
              message: `No content hash found for ref: ${ref}`,
            },
          };
        }

        const content = await SlugClient.FromEndpoint.FileContent.get(baseUrl, hash, options);
        if (!content.ok) return content;

        return {
          ok: true,
          value: {
            tree: tree.value,
            refs,
            ref,
            hash,
            contentIndex: contentIndex.value,
            content: content.value,
          },
        };
      },
    },
  };
}

function fromDataset(args: t.SlcDataClient.DatasetArgs): t.SlcDataClient.Client {
  const dataset = String(args.dataset).trim();
  const docid = (args.docid ?? dataset) as t.StringId;
  const baseUrl = Url.parse(args.origin).join(dataset) as t.StringUrl;
  return create({ baseUrl, docid, layout: args.layout });
}

function findHash(entries: readonly t.SlugFileContentEntry[], ref: string): string | undefined {
  const entry = entries.find((item) => item.frontmatter?.ref === ref || item.path === ref);
  return entry?.hash;
}

function refsFromTree(tree: t.SlugTreeItems, total = Num.MAX_INT): string[] {
  const refs: string[] = [];
  for (const item of tree) {
    if (refs.length >= total) break;
    const ref = 'ref' in item && Is.str(item.ref) ? item.ref : undefined;
    if (ref && ref.length > 0) refs.push(ref);

    const slugs = item.slugs;
    if (Array.isArray(slugs) && refs.length < total) {
      const remaining = total - refs.length;
      refs.push(...refsFromTree(slugs, remaining));
    }
  }

  return Array.from(new Set(refs)).slice(0, total);
}

function selectOrFirst(selected: string | undefined, refs: readonly string[]): string | undefined {
  if (selected && refs.includes(selected)) return selected;
  return refs[0];
}
