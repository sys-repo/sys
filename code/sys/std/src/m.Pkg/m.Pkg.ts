import { type t, D } from './common.ts';
import { Dist } from './m.Dist.ts';
import { Is } from './m.Is.ts';
import { fromJson } from './u.fromJson.ts';
import { toPkg } from './u.toPkg.ts';
import { toString } from './u.toString.ts';

export const Pkg: t.PkgLib = {
  Is,
  Dist,

  toPkg,
  toString,
  fromJson,
  unknown() {
    return { ...D.UNKNOWN };
  },
};
