import { type t } from './common.ts';
import { AliasIs as Is } from './m.Is.ts';
import { make } from './u.make.ts';

export const AliasResolver: t.AliasResolverLib = {
  Is,
  make,
};
