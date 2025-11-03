import { type t, Fmt as Base, c, Cli, D, Str, Time } from './common.ts';

export const Fmt = {
  ...Base,

  async help(toolname: string = D.toolname) {
    return Base.help(toolname);
  },
} as const;
