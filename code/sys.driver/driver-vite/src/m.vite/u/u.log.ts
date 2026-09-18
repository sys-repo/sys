import { ViteLog } from '../../m.fmt/mod.ts';
import { clipLine, outputWidth, reserveWidth } from '../../m.fmt/u.ts';
import { c, Cli, Path, type t } from '../common.ts';

type BuildArgs = t.ViteLog.Bundle.Args & {
  stdio: string;
};

type BuildPathsArgs = {
  cwd: t.StringAbsoluteDir;
  paths: t.ViteConfig.Paths;
  width?: number;
};

/**
 * Logging helpers.
 */
export const Log = {
  /**
   * Startup entry.
   */
  Entry: {
    log(Pkg: t.Pkg, input: t.StringPath) {
      console.info(Log.Entry.toString(Pkg, input, { pad: true }));
    },
    toString(Pkg: t.Pkg, input: t.StringPath, options: { pad?: boolean } = {}) {
      input = input.replace(/^\.\//, ''); // trim leading "./" relative prefix (reduce visual noise).
      const text = `
${c.gray(`module:   ${ViteLog.Module.toString(Pkg)}`)}
${c.brightGreen(`entry:    ${wrangle.fmtPath(input)}`)}
    `;
      return ViteLog.pad(text, options.pad);
    },
  },

  /**
   * Build log
   */
  Build: {
    log(args: BuildArgs) {
      console.info(Log.Build.toString(args));
    },

    paths(args: BuildPathsArgs) {
      const width = wrangle.width(args.width);
      return [
        clipLine(c.bold(c.brightGreen('Paths')), width),
        wrangle.row('Directory:', `${args.cwd.replace(/\/$/, '')}/`, width),
        wrangle.row('  • entry:', wrangle.cleanPath(args.paths.app.entry), width),
        wrangle.row('  • outDir:', `${wrangle.cleanPath(args.paths.app.outDir)}/`, width),
        wrangle.row('  • base:', `${wrangle.cleanPath(args.paths.app.base)}/`, width),
      ].join('\n').trimEnd();
    },
    toString(args: BuildArgs) {
      const { ok, stdio, dirs, pkg, pkgSize, hash, manifestUrl, totalSize, elapsed, width } = args;
      const bundle = ViteLog.Bundle.toString({
        ok,
        dirs,
        totalSize,
        pkg,
        pkgSize,
        hash,
        manifestUrl,
        elapsed,
        width,
      });
      const vite = wrangle.clipLines(stdio, width);
      const text = vite ? `${vite}\n\n${bundle}` : bundle;
      return ViteLog.pad(text, args.pad);
    },
  },
} as const;

/**
 * Helpers:
 */
const wrangle = {
  fmtPath(path: string = '') {
    path = Path.trimCwd(path.trim());
    if (path === '' || path === '.') path = './';
    if (path === './') path = `./ ${c.dim('(root directory)')}`;
    return c.gray(path);
  },

  cleanPath(input: t.StringPath = '') {
    return input
      .trim()
      .replace(/^(?:\.\/)+/, '')
      .replace(/\/+$/, '');
  },

  row(label: string, value: string, width: number) {
    const prefix = c.gray(label.padEnd(14, ' '));
    const valueWidth = reserveWidth(width, Cli.Fmt.Text.Width.measure(prefix));
    const text = `${prefix}${clipLine(c.gray(value), valueWidth)}`.trimEnd();
    return clipLine(text, width);
  },

  width: outputWidth,

  clipLines(text: string, inputWidth?: number) {
    const width = wrangle.width(inputWidth);
    return text.split('\n').map((line) => wrangle.clipLine(line, width)).join('\n').trimEnd();
  },

  clipLine,
} as const;
