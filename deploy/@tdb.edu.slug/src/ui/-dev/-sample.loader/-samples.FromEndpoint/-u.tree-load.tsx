import { type t, Is, SlugClient, Url } from './-common.ts';

const FromEndpoint = SlugClient.FromEndpoint;

export const SampleTree: t.FetchSample = {
  label: 'FromEndpoint.Tree.load',

  /**
   * Load slug-tree and file-content (via ref).
   */
  async run(e) {
};

function findTreeRef(tree: readonly t.SlugTreeItem[]): string | undefined {
  for (const item of tree) {
    if (Is.string((item as { ref?: unknown }).ref)) {
      return (item as { ref: string }).ref;
    }
    if (item.slugs) {
      const found = findTreeRef(item.slugs);
      if (found) return found;
    }
  }
  return undefined;
}

async function loadContentFromRef(args: {
  baseUrl: t.StringUrl;
  docid: t.StringId;
  manifestsDir: t.StringDir;
  ref: string;
}): Promise<t.SlugClientResult<{ hash: string; content: t.SlugFileContentDoc }>> {
  const index = await FromEndpoint.FileContent.index(args.baseUrl, args.docid, {
    layout: { manifestsDir: args.manifestsDir },
  });
  if (!index.ok) return index;

  const entry = index.value.entries.find((item) => {
    if (item.frontmatter?.ref === args.ref) return true;
    if (item.path === args.ref) return true;
    return false;
  });
  const hash = entry?.hash;
  if (!hash) {
    return {
      ok: false,
      error: { kind: 'schema', message: `Missing hash for ref: ${args.ref}` },
    };
  }

  const content = await FromEndpoint.FileContent.get(args.baseUrl, hash, {
    layout: { contentDir: 'content' },
  });
  if (!content.ok) return content;

  return { ok: true, value: { hash, content: content.value } };
}
