import { D, type t } from './common.ts';
import { Dist } from './m.Dist.ts';
import { PkgIs as Is } from './m.Is.ts';
import { fromJson } from './u.fromJson.ts';
import { toPkg } from './u.toPkg.ts';
import { toFileNamespace } from './u.toFileNamespace.ts';
import { toString } from './u.toString.ts';

export const Pkg: t.Pkg.Lib = {
  Is,
  Dist,

  toPkg,
  toString,
  toFileNamespace,
  fromJson,
  unknown: D.unknown,
};
