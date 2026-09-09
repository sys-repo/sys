import { type t, D, Num, Obj } from './common.ts';

export const values: t.MediaFiltersLib['values'] = (filters) => {
  const res: Partial<t.MediaFilterValues> = {};
  filters.forEach((k) => (res[k] = D.config[k].initial));
  return res;
};

export const toString: t.MediaFiltersLib['toString'] = (values = {}) => {
  return Obj.keys(D.config)
    .filter((name) => values[name] !== undefined)
    .map((name) => ({ name, unit: D.config[name].unit, value: Num.toString(values[name]) }))
    .map((e) => `${e.name}(${e.value}${e.unit})`)
    .join(' ');
};
