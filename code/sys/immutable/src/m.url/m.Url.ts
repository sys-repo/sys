import { type t, UrlBase } from './common.ts';
import { dsl } from './u.dsl.ts';
import { ref } from './u.ref.ts';

export const Url: t.Immutable.Url.Lib = {
  ...UrlBase,
  ref,
  dsl,
};
