import { pkg } from '../pkg.ts';
import { c, Cli, Fs, Pkg, Str } from './libs.ts';
import * as t from './t.ts';

export const Fmt = {
  async header(toolname: string, dir?: t.StringDir) {
    const b = Str.builder();
    b.line(c.gray(`${c.green(toolname)} v${pkg.version}`));
    if (dir) b.line(c.gray(await Fs.Fmt.treeFromDir(dir, { indent: 2 })));
    return b.toString();
  },

  signoff(toolname: string) {
    const self = `${Pkg.toString(pkg)}:${toolname}`;
    return Str.builder().line(c.dim(self)).toString();
  },

  async help(toolname: string = 'Tools') {
    const table = Cli.table([]);

    const gr = c.gray;
    // table.push([gr(` ├─ ${pkg.name}`), pkg.version]);
    table.push([gr(` └─ ${pkg.name}`), pkg.version]);

    return Str.builder()
      .line()
      .line(c.gray(`${c.green(toolname)} `))
      .line(table.toString().trim())
      .line()
      .toString();
  },
} as const;
