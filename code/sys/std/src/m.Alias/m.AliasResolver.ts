import type { t } from './common.ts';
import { AliasIs as Is } from './m.Is.ts';
import { analyze } from './u.analyze.ts';
import { expand } from './u.expand.ts';
import { make } from './u.make.ts';

export const AliasResolver: t.AliasResolverLib = {
  Is,
  make,
  analyze,
  expand,
};
