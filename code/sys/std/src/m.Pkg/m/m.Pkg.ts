import { D, type t } from '../common.ts';
import { fromJson } from '../u/u.fromJson.ts';
import { toFileNamespace } from '../u/u.toFileNamespace.ts';
import { toPkg } from '../u/u.toPkg.ts';
import { toString } from '../u/u.toString.ts';
import { Dist } from './m.Dist.ts';
import { PkgIs as Is } from './m.Is.ts';
import { Subpath } from './m.Subpath.ts';

export const Pkg: t.Pkg.Lib = {
  Is,
  Subpath,
  Dist,
  toPkg,
  toString,
  toFileNamespace,
  fromJson,
  unknown: D.unknown,
};
