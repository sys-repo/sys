import { type t, D, isRecord } from './common.ts';

export const toString: t.PkgLib['toString'] = (pkg, suffix, input) => {
  const options = wrangle.options(input);
  if (!pkg || !isRecord(pkg)) return toString(D.UNKNOWN);

  const { name = D.UNKNOWN.name, version = D.UNKNOWN.version } = pkg;
  let res = name;
  if (options.version ?? true) res += `@${version}`;

  if (typeof suffix === 'string') {
    suffix = suffix.trim().replace(/^\:+/, '').trimStart();
    if (suffix) res = `${res}:${suffix}`;
  }
  return res;
};

/**
 * Helpers:
 */
const wrangle = {
  options(input: Parameters<t.PkgLib['toString']>[2]): t.PkgToStringOptions {
    if (input == null) return {};
    if (typeof input === 'boolean') return { version: input };
    return input;
  },
} as const;
