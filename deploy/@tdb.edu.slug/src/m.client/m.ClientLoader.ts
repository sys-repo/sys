import { type t, SlugClient } from './common.ts';
import { make } from './u.loader.make.ts';

export const ClientLoader: t.SlugLoaderLib = {
  Fetch: SlugClient,
  make,
};
