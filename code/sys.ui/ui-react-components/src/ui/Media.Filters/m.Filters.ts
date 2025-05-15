import { type t, D, Obj } from './common.ts';
import { Filter } from './ui.Filter.tsx';
import { List } from './ui.tsx';

const config = D.config;

export const Filters: t.MediaFiltersLib = {
  UI: { List, Filter },
  config,

  values(filters) {
    const res: Partial<t.MediaFilterValueMap> = {};
    filters.forEach((k) => (res[k] = Filters.config[k].initial));
    return res;
  },

  toString(values: Partial<t.MediaFilterValueMap> = {}) {
    return Obj.keys(config)
      .filter((name) => values[name] !== undefined)
      .map((name) => {
        const unit = config[name].unit;
        return `${name}(${values[name]}${unit})`;
      })
      .join(' ');
  },
};
