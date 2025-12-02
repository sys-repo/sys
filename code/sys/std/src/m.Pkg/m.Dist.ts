import { type t } from './common.ts';
import { location } from './u.dist.location.ts';
import { fetchDist as fetch } from './u.dist.fetch.ts';

export const Dist: t.PkgDistLib = {
  fetch,
  location,

  Is: {
    codePath(path) {
      if (typeof path !== 'string') return false;
      return path.startsWith('pkg/') || path.includes('/pkg/');
    },
  },
};
