import { type t, SlugClient as Fetch } from './common.ts';
import { make } from './u.make.ts';
import { Origin } from './m.Origin.ts';

export const SlugLoader: t.SlugLoaderLib = {
  Fetch,
  Origin,
  make,
};
