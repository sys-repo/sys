import { type t } from './common.ts';

export const toString: t.EsmLib['toString'] = (module, options = {}) => {
  const registry = (options.registry ?? module.registry).trim();
  const name = (options.name ?? module.name).trim();
  const version = (options.version ?? module.version).trim();
  const subpath = (options.subpath ?? module.subpath).trim().replace(/^\/*/, '');

  let res = name;
  if (registry) res = `${registry}:${res}`;
  if (version) res += `@${version}`;
  if (subpath) res += `/${subpath}`;
  return res.trim();
};
