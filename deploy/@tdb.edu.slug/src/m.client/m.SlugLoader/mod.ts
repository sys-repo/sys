import { type t, SlugClient as Fetch } from './common.ts';
import { Origin } from './m.Origin.ts';
import { Descriptor } from './m.Descriptor.ts';

export const SlugLoader: t.SlugLoaderLib = {
  Fetch,
  Origin,
  Descriptor,
};
