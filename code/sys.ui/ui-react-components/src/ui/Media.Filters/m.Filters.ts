import { type t, D } from './common.ts';
import { toString, values } from './u.ts';
import { Filter } from './ui.Filter.tsx';
import { List } from './ui.tsx';

export const Filters: t.MediaFiltersLib = {
  UI: { List, Filter },
  config: D.config,
  values,
  toString,
};
