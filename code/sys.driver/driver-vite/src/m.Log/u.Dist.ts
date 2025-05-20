import { type t, Pkg } from './common.ts';

export const Dist: t.ViteLogLib['Dist'] = {
  log(dist, options = {}) {
    console.info(Dist.toString(dist, options));
  },

  toString(dist, options = {}) {
    const { title } = options;
    const dir = options.dirs?.out ?? '.';
    return Pkg.Dist.Log.dist(dist, { title, dir });
  },
};
