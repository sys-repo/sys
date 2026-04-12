import { type t, Fmt as Base, c, Cli, Fs, Str } from './common.ts';

export const Fmt = {
  ...Base,

  async help(cwd: t.StringDir) {
    const cmd = Base.invoke('crypto');
    const direct = Cli.table([]);
    direct.push([c.gray('  cmd'), c.white(`${cmd} hash [dir]`)]);
    direct.push([c.gray('  dir'), c.gray('optional target directory (defaults to current dir)')]);
    direct.push([c.gray('  --save'), c.gray('write dist.json in target directory')]);
    direct.push([c.gray('  -h, --help'), c.gray('show help')]);

    const note = `Note: flags apply to direct commands only; interactive mode collects options in the UI.`;

    const str = Str.builder()
      .line(c.gray(`working dir: ${Fs.trimCwd(cwd)}`))
      .line(await Base.help(cmd))
      .line(c.gray('direct command:'))
      .line(String(direct))
      .blank()
      .line(c.gray(c.dim(note)))
      .line();

    return String(str);
  },
} as const;
