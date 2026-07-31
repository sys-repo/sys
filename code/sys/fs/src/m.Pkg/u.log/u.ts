import { c, type t } from '../common.ts';

export const toModuleString = (pkg: t.Pkg, hash?: string) => {
  const version = `${c.white(pkg.name)}@${c.cyan(pkg.version)}`;
  const hx = hash ? c.dim(`.#${hash.trim()}`) : '';
  return c.gray(`${version}${hx}`);
};
