import { type t, Fmt as Base, c, D, Fs, Pkg, pkg, Str } from './common.ts';
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

  async folderAsText(args: {
    dir: t.StringDir;
    reqPath: string;
    indent?: number;
    maxDepth?: number;
    filter?: (path: t.StringPath) => boolean;
  }) {
    const { dir, reqPath, indent = 3, maxDepth = 1, filter } = args;
    const tree = await Fs.Fmt.treeFromDir(Fs.join(dir, reqPath), { maxDepth, indent, filter });

    const str = Str.builder()
      .line(Fs.dirname(Fs.join(dir, reqPath)))
      .line()
      .line()
      .line(tree)
      .line()
      .line()
      .line(`${Pkg.toString(pkg)}/serve`);

    return String(str);
  },
} as const;
