import { type t, D, Obj } from './common.ts';

export const values: t.MediaFiltersLib['values'] = (filters) => {
  const res: Partial<t.MediaFilterValueMap> = {};
  filters.forEach((k) => (res[k] = D.config[k].initial));
  return res;
};

export const toString: t.MediaFiltersLib['toString'] = (values = {}) => {
  return Obj.keys(D.config)
    .filter((name) => values[name] !== undefined)
    .map((name) => ({ name, unit: D.config[name].unit, value: formatNumber(values[name]) }))
    .map((e) => `${e.name}(${e.value}${e.unit})`)
    .join(' ');
};

/**
 * Helpers:
 */
const formatNumber = (value: number = 0, maxDecimals = 2) =>
  new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals,
  }).format(value);
