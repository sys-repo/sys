import { type t } from './common.ts';
import { Origin } from './m.Origin.ts';

type M = t.SlugLoaderLib['make'];

export const make: M = (input) => {
  const origin = Origin.parse(input);
  return { origin };
};
