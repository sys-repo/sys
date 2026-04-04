import { type t, c, Cli, Fs } from './common.ts';

export const Fmt: t.WorkspacePrep.Fmt.Lib = {
  importMap(args) {
    const total = args.total.toLocaleString();
    const cwd = args.cwd ?? Fs.cwd();
    const header = c.brightGreen(c.bold('Workspace import map'));
    const summary = c.gray(` (${total} dependencies written to):`);
    const paths = args.paths.map((path) => Cli.Fmt.Path.str(Fs.trimCwd(path, { cwd })));

    if (paths.length <= 1) {
      const suffix = paths[0] ? ` ${paths[0]}` : '';
      return `${header}\n${summary}${suffix}`;
    }

    const items = paths.map((path) => `  - ${path}`).join('\n');
    return `${header}\n${summary}\n${items}`;
  },
};
