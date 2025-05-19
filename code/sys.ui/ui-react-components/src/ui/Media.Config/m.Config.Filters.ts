import { type t, D } from './common.ts';
import { toString, values } from './u.ts';
import { List } from './ui.Filters.tsx';

export const Filters: t.MediaFiltersLib = {
  UI: { List },
  config: D.config,
  values,
  toString,
};
