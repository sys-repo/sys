import { type t } from './common.ts';

export const toString: t.EsmLib['toString'] = (module, options = {}) => {
  const prefix = (options.prefix ?? module.prefix).trim();
  const name = (options.name ?? module.name).trim();
  const version = (options.version ?? module.version).trim();

  let res = name;
  if (prefix) res = `${prefix}:${res}`;
  if (version) res += `@${version}`;
  return res.trim();
};
