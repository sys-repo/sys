import { type t } from './common.ts';
import { fetchDist as fetch } from './u.dist.fetch.ts';
import { Part } from './m.Dist.Part.ts';

export const Dist: t.PkgDistLib = {
  Part,
  fetch,
  Is: {
    codePath(path) {
      if (typeof path !== 'string') return false;
      return path.startsWith('pkg/') || path.includes('/pkg/');
    },
  },
};
