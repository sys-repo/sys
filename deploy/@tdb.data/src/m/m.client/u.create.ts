import { type t, SlugClient, Url } from './common.ts';
import { toLayout } from './u.layout.ts';
import { loadTreeContent } from './u.treeContent.ts';

export function create(args: t.SlugDataClient.CreateArgs): t.SlugDataClient.Client {
  const layout = toLayout(args.layout);
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
    Timeline: {
      Playback: {
        load: () => SlugClient.FromEndpoint.Timeline.Playback.load(baseUrl, docid, options),
      },
    },
    TreeContent: {
      load: (input) => loadTreeContent(baseUrl, docid, options, input),
    },
  };
}
