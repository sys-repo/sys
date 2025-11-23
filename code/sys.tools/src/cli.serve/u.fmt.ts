import { type t, Fmt as Base, c, Cli, D, Fs, getConfig, Str, Time } from './common.ts';

export const Fmt = {
  ...Base,

  async help(toolname: string = D.toolname, dir: t.StringDir) {
    const config = await getConfig(dir);

    const str = Str.builder()
      .line(c.gray(`working dir: ${Fs.trimCwd(dir)}`))
      .line(await Base.help(toolname))
      .line();

    return String(str);
  },
} as const;
