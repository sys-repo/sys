import { type t, c } from './common.ts';
export const toModuleString = (pkg: t.Pkg) => c.gray(`${c.white(pkg.name)}@${c.cyan(pkg.version)}`);
