import { type t, Fmt as Base, c, Cli, D, getConfig, Str, Time } from './common.ts';

export const Fmt = {
  ...Base,

  async help(toolname: string = D.toolname, dir: t.StringDir) {
    const config = await getConfig(dir);

    const str = Str.builder()
      .line(await Base.help(toolname))
      .line();

    return String(str);
  },
} as const;
