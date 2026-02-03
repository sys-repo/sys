import { type t, SlugClient } from './common.ts';
import { parseOrigin } from './u.origin.ts';

type M = t.SlugLoaderLib['make'];

export const make: M = (args) => {
  const origin = parseOrigin(args.origin);
  return {
    origin,
    Tree: {
      load(docid, options) {
        return SlugClient.FromEndpoint.Tree.load(origin.cdn.default, docid, options);
      },
    },
  };
};
