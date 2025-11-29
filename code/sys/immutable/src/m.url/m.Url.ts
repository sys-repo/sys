import { type t, UrlBase } from './common.ts';
import { ref } from './u.ref.ts';

export const Url: t.ImmutableUrlLib = {
  ...UrlBase,
  ref,
};
