import { pkg, Pkg } from './common.ts';
import type { SysCmdLib } from './t.ts';

/**
 * Common system "Cmd" (Command Line) API.
 */
export const Cmd: SysCmdLib = {
  async main(argv) {
    /**
     * TODO 🐷
     */
    console.log('WIP:🐷', Pkg.toString(pkg), '→', argv);
  },
};
