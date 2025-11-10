import { type t } from './common.ts';

import {
  cursor,
  Durations,
  mapToSource,
  normalize,
  Ops,
  resolve,
  Time,
  validate,
} from './u/mod.ts';

export const Helpers: t.CompositeVideoHelpers = {
  resolve,
  mapToSource,
  validate,
  normalize,
  cursor,
  Time,
  Durations,
  Ops,
};
