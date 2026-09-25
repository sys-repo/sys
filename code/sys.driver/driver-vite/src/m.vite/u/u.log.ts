import { ViteLog } from '../../m.fmt/mod.ts';
import { clipLine, metadataRow, outputWidth } from '../../m.fmt/u.ts';
import { c, Cli, Path, type t, Url } from '../common.ts';

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
      const { app } = args.paths;
      const outDirUrl = Path.toFileUrl(Path.resolve(args.cwd, app.outDir));
      if (!outDirUrl.pathname.endsWith('/')) outDirUrl.pathname += '/';
      const rows = [
        { label: 'entry:', value: wrangle.cleanPath(app.entry) },
        { label: 'outDir:', value: `${wrangle.cleanPath(app.outDir)}/`, valueUrl: outDirUrl },
        { label: 'base:', value: app.base, valueUrl: wrangle.baseUrl(app.base) },
      ];
      const children = rows.map(({ label, value, valueUrl }, index) => {
        const branch = Cli.Fmt.Tree.branch([index, rows]);
        return wrangle.row(` ${branch} ${label}`, value, width, valueUrl);
      });
      return [
        wrangle.row('directory:', `${args.cwd.replace(/\/$/, '')}/`, width),
        ...children,
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

  baseUrl(base: string): URL | undefined {
    const parsed = Url.parse(base);
    if (!parsed.ok) return undefined;
    const url = parsed.toURL();
    return url.protocol === 'http:' || url.protocol === 'https:' ? url : undefined;
  },

  row(label: string, value: string, width: number, valueUrl?: URL) {
    return metadataRow({ label, value, valueUrl, width, labelWidth: 13, valueColor: c.gray });
  },

  width: outputWidth,

  clipLines(text: string, inputWidth?: number) {
    const width = wrangle.width(inputWidth);
    return text.split('\n').map((line) => wrangle.clipLine(line, width)).join('\n').trimEnd();
  },

  clipLine,
} as const;
