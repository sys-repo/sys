import { type t, SlugClient as Fetch } from './common.ts';
import { make } from './u.make.ts';
import { Origin } from './m.SlugLoader.Origin.ts';

export const ClientLoader: t.SlugLoaderLib = {
  Fetch,
  Origin,
  make,
};
