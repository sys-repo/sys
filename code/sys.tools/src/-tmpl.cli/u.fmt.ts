import { type t, Fmt as Base, c, D, Fs, Str } from './common.ts';

export const Fmt = {
  ...Base,

  async help(toolname: string = D.tool.name, cwd: t.StringDir) {
    const str = Str.builder()
      .line(c.gray(`working dir: ${Fs.trimCwd(cwd)}`))
      .line(await Base.help(toolname))
      .line(
        c.gray(
          c.dim(
            'Note: flags apply to direct commands only; interactive mode collects options in the UI.',
          ),
        ),
      )
      .line();

    return String(str);
  },
} as const;
