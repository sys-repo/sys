import { type t, Fmt as Base, c, Cli, D, Fs, Str, Time } from './common.ts';

export const Fmt = {
  ...Base,

  async help(toolname: string = D.tool.name, cwd: t.StringDir) {
    const str = Str.builder()
      .line(c.gray(`working dir: ${Fs.trimCwd(cwd)}`))
      .line(await Base.help(toolname))
      .line();

    return String(str);
  },
} as const;
