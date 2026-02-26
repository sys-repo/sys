import { type t, Fmt as Base, c, Cli, D, Fs, Str, Time } from './common.ts';

export const Fmt = {
  ...Base,

  async help(toolname: string = D.tool.name, cwd: t.StringDir) {
    const str = Str.builder()
      .line(c.gray(`working dir: ${Fs.trimCwd(cwd)}`))
      .line(await Base.help(toolname))
      .line(c.gray(c.dim('note: flags apply to direct commands only; interactive mode collects options in the UI.')))
      .line();

    return String(str);
  },
} as const;
