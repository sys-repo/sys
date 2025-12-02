import { pkg } from '../pkg.ts';
import { c, Cli, Fs, Pkg, Str } from './libs.ts';
import * as t from './t.ts';

export type HelpCallback = (e: HelpCallbackArgs, c: t.AnsiColors) => void;
export type HelpCallbackArgs = {
  row(...s: string[]): HelpCallbackArgs;
};

export const Fmt = {
  Tree: Cli.Fmt.Tree,

  /**
   * Common intro header.
   */
  async header(
    toolname: string,
    dir?: t.StringDir,
    opts: {
      fileTree?: { maxDepth?: number; indent?: number };
      exitHint?: boolean;
    } = {},
  ) {
    const { fileTree = {}, exitHint = true } = opts;
    const { maxDepth, indent } = fileTree;

    let identity = c.gray(`${c.green(toolname)} v${pkg.version}`);
    if (exitHint) identity += c.gray(c.dim(` (Ctrl-C to exit)`));

    const b = Str.builder();
    if (dir) {
      b.line(c.gray(await Fs.Fmt.treeFromDir(dir, { indent, maxDepth })));
      b.line();
    }
    b.line(identity);
    return b.toString();
  },

  /**
   * Common signoff.
   */
  signoff(toolname: string) {
    const self = `${Pkg.toString(pkg)}:${toolname}`;
    return Str.builder()
      .line(c.dim(c.gray(self)))
      .toString();
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

    e.row(c.gray(pkg.name), c.cyan(pkg.version));
    fn?.(e, c);

    rows.forEach((col, i, total) => {
      const branch = Fmt.Tree.branch([i, total]);
      table.push([` ${c.gray(branch)} ${col[0]}`, ...col.slice(1)]);
    });

    return Str.builder()
      .line()
      .line(c.gray(`${c.green(toolname)} `))
      .line(Str.trimEdgeNewlines(table.toString()))
      .line()
      .toString();
  },

  /**
   * Common prerequisites:
   */
  Prereqs: {
    folderNotConfigured(cwd: t.StringDir, toolname: string) {
      const str = Str.builder()
        .line()
        .line(c.yellow(c.italic(`  Folder is not yet configured for ${c.white(toolname)}.`)))
        .line();
      return String(str);
    },
  },

  /**
   * Generic number formatter with optional warning color.
   */
  number(value: number, warnAt?: number, fmt?: (n: number) => string): string {
    const s = fmt ? fmt(value) : value.toLocaleString();
    if (warnAt === undefined) return s;
    return value > warnAt ? c.yellow(s) : s;
  },

  /**
   * Formats bytes using `Str.bytes` and optional warning color.
   */
  bytes(bytes: t.NumberBytes, warnAt?: t.NumberBytes): string {
    return Fmt.number(bytes, warnAt, Str.bytes);
  },

  /**
   * Common format for text in a waiting spinner.
   */
  spinnerText(text: string) {
    return c.italic(c.gray(text));
  },

  prettyPath(path: t.StringPath, highlightLevels = 1) {
    const parts = path.split('/');
    const start = parts.slice(0, -highlightLevels);
    const end = parts.slice(-highlightLevels);
    return c.gray(`${start.join('/')}/${c.cyan(end.join('/'))}`);
  },
} as const;
