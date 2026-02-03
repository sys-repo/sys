import { type t, SlugClient } from './common.ts';
import { make } from './u.loader.make.ts';

export const ClientLoader: t.SlugClientLoaderLib = {
  Fetch: SlugClient,
  make,
};
