import { type t, Fmt as Base, c, D, Fs, Str } from './common.ts';

export const Fmt = {
  ...Base,

  async help(toolname: string = D.tool.name, cwd: t.StringDir) {
    const note = 'This command is a thin wrapper surface; subcommand delegation is configured separately.';

    const str = Str.builder()
      .line(c.gray(`working dir: ${Fs.trimCwd(cwd)}`))
      .line(await Base.help(toolname))
      .line(c.gray(c.dim(note)))
      .line();

    return String(str);
  },
} as const;
