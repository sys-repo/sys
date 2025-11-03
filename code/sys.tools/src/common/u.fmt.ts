import { pkg } from '../pkg.ts';
import { c, Cli, Fs, Pkg, Str } from './libs.ts';
import * as t from './t.ts';

export type HelpCallback = (e: HelpCallbackArgs, c: t.AnsiColors) => void;
export type HelpCallbackArgs = {
  row(...s: string[]): HelpCallbackArgs;
};

export const Fmt = {
  /**
   * Common intro header.
   */
  async header(toolname: string, dir?: t.StringDir) {
    const b = Str.builder();
    b.line(c.gray(`${c.green(toolname)} v${pkg.version}`));
    if (dir) b.line(c.gray(await Fs.Fmt.treeFromDir(dir, { indent: 2 })));
    return b.toString();
  },

  /**
   * Common signoff.
   */
  signoff(toolname: string) {
    const self = `${Pkg.toString(pkg)}:${toolname}`;
    return Str.builder().line(c.dim(self)).toString();
  },

  /**
   * Common help.
   */
  async help(toolname: string, fn?: HelpCallback) {
    const table = Cli.table([]);

    let rows: string[][] = [];
    const e: HelpCallbackArgs = {
      row(...s) {
        rows.push(s);
        return e;
      },
    };

    e.row(c.gray(pkg.name), pkg.version);
    fn?.(e, c);

    rows.forEach((col, i) => {
      const last = i === rows.length - 1;
      const prefix = last ? '└─' : '├─';
      table.push([` ${c.gray(prefix)} ${col[0]}`, ...col.slice(1)]);
    });

    return Str.builder()
      .line()
      .line(c.gray(`${c.green(toolname)} `))
      .line(Str.trimEdgeNewlines(table.toString()))
      .line()
      .toString();
  },
} as const;
