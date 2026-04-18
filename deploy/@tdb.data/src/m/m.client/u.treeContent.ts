import { type t, SlugClient } from './common.ts';
import { findHash, refsFromTree, selectOrFirst } from './u.refs.ts';

type O = {
  readonly layout: t.SlugDataClient.Layout;
};

export async function loadTreeContent(
  baseUrl: t.StringUrl,
  docid: t.StringId,
  options: O,
  input: t.SlugDataClient.TreeContentArgs = {},
): Promise<t.SlugClientResult<t.SlugDataClient.TreeContentValue>> {
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
}
