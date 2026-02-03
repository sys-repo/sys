import { type t } from './common.ts';
import { parseOrigin } from './u.origin.ts';

type M = t.SlugClientLoaderLib['make'];

export const make: M = (args) => {
  const origin = parseOrigin(args.origin);
  return { origin };
};
