import { type t, SlugClient as Fetch } from './common.ts';
import { make } from './u.make.ts';
import { Origin } from './m.Origin.ts';
import { Descriptor } from './m.Descriptor.ts';

export const SlugLoader: t.SlugClientLoaderLib = {
  Fetch,
  Origin,
  Descriptor,
  make,
};
