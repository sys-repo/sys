import { type t, pkg, Pkg } from './common.ts';

export const Cmd: t.SysCmdLib = {
  async main(argv) {
    console.log('🐷', Pkg.toString(pkg), '→', argv);
  },
};
