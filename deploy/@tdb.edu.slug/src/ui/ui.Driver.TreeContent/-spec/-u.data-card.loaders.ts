import { DataCards, DESCRIPTOR } from '../../-dev/ui.Http.DataCards/mod.ts';
import { type t, Is } from './common.ts';

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
  return DataCards.Helpers.treeFromResponse(input);
}

/**
 * Helpers
 */
function fileContentLoader(origin?: t.SlugUrlOrigin): TLoad {
  return async ({ request }) => {
    const url = origin?.cdn.default;
    if (!Is.str(url) || url.length === 0) throw new Error('Missing HTTP origin');

    const client = await DESCRIPTOR.file.client({
      origin: url,
    });
    if (!client.ok) throw new Error(client.error.message);

    const index = await client.value.FileContent.index();
    if (!index.ok) throw new Error(index.error.message);

    const hash = DataCards.Helpers.findHash(index.value.entries, request.key);
    if (!hash) throw new Error(`No content hash found for ref: ${request.key}`);

    const file = await client.value.FileContent.get(hash);
    if (!file.ok) throw new Error(file.error.message);

    return {
      kind: 'file-content',
      content: file.value,
      index: index.value,
    };
  };
}

function playbackContentLoader(origin?: t.SlugUrlOrigin): TLoad {
  return async ({ request }) => {
    const url = origin?.cdn.default;
    if (!Is.str(url) || url.length === 0) throw new Error('Missing HTTP origin');

    const client = await DESCRIPTOR.media.client({
      origin: url,
      docid: request.key,
    });
    if (!client.ok) throw new Error(client.error.message);

    const assets = await client.value.Timeline.Assets.load();
    if (!assets.ok) throw new Error(assets.error.message);
    const playback = await client.value.Timeline.Playback.load();
    if (!playback.ok) throw new Error(playback.error.message);

    return {
      kind: 'playback-content',
      playback: playback.value,
      assets: assets.value.assets,
    };
  };
}
