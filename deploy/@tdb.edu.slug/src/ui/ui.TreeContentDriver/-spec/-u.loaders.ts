import { TreeData } from '../../m.data/mod.ts';
import { type t, Is, SlugLoader } from './common.ts';

type TLoad = t.TreeContentDriver.ContentLoader;
type ResolveLoaderArgs = {
  readonly kind: t.DataCardKind;
  readonly origin?: t.SlugUrlOrigin;
};

export function resolveLoader(args: ResolveLoaderArgs): TLoad {
  if (args.kind === 'playback-content') return playbackContentLoader(args.origin);
  return fileContentLoader(args.origin);
}

export function treeFromResponse(input: unknown): t.TreeHostViewNodeList | undefined {
  if (!Is.record(input)) return undefined;
  const value = Is.record(input.value) ? input.value : undefined;
  const tree = value && Is.record(value.tree) ? value.tree : undefined;
  if (!tree || !Array.isArray(tree.tree)) return undefined;
  return TreeData.fromSlugTree(tree as t.SlugTreeDoc);
}

/**
 * Helpers
 */
function fileContentLoader(origin?: t.SlugUrlOrigin): TLoad {
  return async ({ request }) => {
    const url = origin?.cdn.default;
    if (!Is.str(url) || url.length === 0) throw new Error('Missing HTTP origin');

    const client = await SlugLoader.Descriptor.client({
      origin: url,
      kind: 'slug-tree:fs',
    });
    if (!client.ok) throw new Error(client.error.message);

    const index = await client.value.FileContent.index();
    if (!index.ok) throw new Error(index.error.message);

    const hash = findHash(index.value.entries, request.key);
    if (!hash) throw new Error(`No content hash found for ref: ${request.key}`);

    const file = await client.value.FileContent.get(hash);
    if (!file.ok) throw new Error(file.error.message);

    return {
      kind: 'file-content',
      docid: client.value.docid,
      ref: request.key,
      hash,
      contentType: file.value.contentType,
      content: file.value,
    };
  };
}

function playbackContentLoader(origin?: t.SlugUrlOrigin): TLoad {
  return async ({ request }) => {
    const url = origin?.cdn.default;
    if (!Is.str(url) || url.length === 0) throw new Error('Missing HTTP origin');

    const client = await SlugLoader.Descriptor.client({
      origin: url,
      kind: 'slug-tree:media:seq',
      docid: request.key,
    });
    if (!client.ok) throw new Error(client.error.message);

    const assets = await client.value.Timeline.Assets.load();
    if (!assets.ok) throw new Error(assets.error.message);
    const playback = await client.value.Timeline.Playback.load();
    if (!playback.ok) throw new Error(playback.error.message);

    return {
      kind: 'playback-content',
      docid: request.key,
      assets: assets.value.assets,
      playback: playback.value,
    };
  };
}

function findHash(entries: readonly t.SlugFileContentEntry[], ref: string): string | undefined {
  const entry = entries.find((item) => item.frontmatter?.ref === ref || item.path === ref);
  return entry?.hash;
}
