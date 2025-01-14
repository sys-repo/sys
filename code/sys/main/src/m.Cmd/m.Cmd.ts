import { type t, pkg, Pkg } from './common.ts';

/**
 * Common system "Cmd" (Command Line) API.
 */
export const Cmd: t.SysCmdLib = {
  async main(argv) {
    /**
     * TODO 🐷
     */
    console.log('WIP:🐷', Pkg.toString(pkg), '→', argv);
  },
};
