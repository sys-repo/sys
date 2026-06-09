import { D, Is, isRecord, type t } from '../common.ts';

export const fromJson: t.Pkg.Lib['fromJson'] = (input, defName, defVersion) => {
  if (!isRecord(input)) return D.unknown();

  const pkg = input as t.Pkg;
  const name = Is.str(pkg.name) ? pkg.name : (defName ?? D.unknown().name);
  const version = Is.str(pkg.version) ? pkg.version : (defVersion ?? D.unknown().version);

  return { name, version };
};
