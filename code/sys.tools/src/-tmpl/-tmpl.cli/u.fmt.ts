import { type t, Fmt as Base, c, Cli, D, Fs, Str, Time } from './common.ts';
import { getConfig } from './u.config.ts';

export const Fmt = {
  ...Base,

  async help(toolname: string = D.toolname, cwd: t.StringDir) {
    const config = await getConfig(cwd);

    const str = Str.builder()
      .line(c.gray(`working dir: ${Fs.trimCwd(cwd)}`))
      .line(await Base.help(toolname))
      .line();

    return String(str);
  },
} as const;
