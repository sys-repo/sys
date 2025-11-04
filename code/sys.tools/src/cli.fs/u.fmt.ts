import { Fmt as Base, D } from './common.ts';

export const Fmt = {
  ...Base,

  async help(toolname: string = D.toolname) {
    return Base.help(toolname);
  },
} as const;
