import { type t, c } from './common.ts';

export const toModuleString = (pkg: t.Pkg, hash?: string) => {
  const version = `${c.white(pkg.name)}@${c.cyan(pkg.version)}`;
  let hx = hash ? c.gray(c.dim(`.${hash.trim()}`)) : '';
  return `${version}${hx}`;
};
