import { type t, c } from './common.ts';

export const Module: t.ViteLogLib['Module'] = {
  log: (pkg: t.Pkg) => console.info(Module.toString(pkg)),
  toString(pkg: t.Pkg) {
    return c.gray(`${c.white(c.bold(pkg.name))}@${c.bold(c.cyan(pkg.version))}`);
  },
};
