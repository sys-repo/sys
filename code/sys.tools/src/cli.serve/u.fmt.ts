import { type t, Fmt as Base, c, D, Fs, Str } from './common.ts';

export const Fmt = {
  ...Base,

  async help(toolname: string = D.tool.name, cwd: t.StringDir) {
    return await Base.help(toolname, {
      note: c.gray(`working dir: ${Fs.trimCwd(cwd)}`),
      usage: [
        `${toolname}`,
        `${toolname} --no-interactive --dir . [--host local|network] [--port 4040] [--open]`,
        `${toolname} --no-interactive --config ./-config/site.serve.yaml [--port 4040] [--open]`,
      ],
      options: [
        ['-h, --help', 'show help'],
        ['--port <number>', 'preferred port (auto-increments if occupied)'],
        ['--no-interactive', 'disable prompts and require direct inputs'],
        ['--dir <path>', 'serve this directory directly'],
        ['--config <path>', 'load a saved serve config YAML'],
        ['--host <local|network>', 'bind 127.0.0.1 or 0.0.0.0'],
        ['--open', 'open the resolved URL after start'],
      ],
      examples: [
        `${toolname} --no-interactive --dir .`,
        `${toolname} --no-interactive --dir . --port 4040`,
        `${toolname} --no-interactive --dir . --host network`,
        `${toolname} --no-interactive --config ./-config/site.serve.yaml --open`,
      ],
    });
  },

  async folderAsText(args: {
    dir: t.StringDir;
    reqPath: string;
    indent?: number;
    maxDepth?: number;
    filter?: (path: t.StringPath) => boolean;
  }) {
    const { dir, reqPath, indent = 6, maxDepth = 1, filter } = args;
    const tree = await Fs.Fmt.treeFromDir(Fs.join(dir, reqPath), { maxDepth, indent, filter });
    const str = Str
      //
      .builder()
      .blank(2)
      .line(tree)
      .blank(2);
    return String(str);
  },
} as const;
