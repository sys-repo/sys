import { type t, D } from './common.ts';
import { Filter } from './ui.Filter.tsx';
import { List } from './ui.tsx';

export const Filters: t.MediaFiltersLib = {
  UI: { List, Filter },
  config: D.config,
  values(filters) {
    const res: Partial<t.MediaFilterValueMap> = {};
    filters.forEach((k) => (res[k] = Filters.config[k].initial));
    return res;
  },
};
