import { type t, D, isRecord } from './common.ts';

export const fromJson: t.PkgLib['fromJson'] = (input, defName, defVersion) => {
  if (!isRecord(input)) return { ...D.UNKNOWN };

  const pkg = input as t.Pkg;
  const name = typeof pkg.name === 'string' ? pkg.name : (defName ?? D.UNKNOWN.name);
  const version = typeof pkg.version === 'string' ? pkg.version : (defVersion ?? D.UNKNOWN.version);

  return { name, version };
};
