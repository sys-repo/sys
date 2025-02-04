import { type t } from './common.ts';

export const toString: t.EsmLib['toString'] = (module) => {
  const { prefix, name = '<Unnamed>', version } = module;
  let res = name;
  if (prefix) res = `${prefix}:${res}`;
  if (version) res += `@${version}`;
  return res;
};
