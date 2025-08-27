import { ViteLog } from '../m.log/mod.ts';
import { type t, Path, c } from './common.ts';

type BuildArgs = t.ViteLogBundleArgs & {
  stdio: string;
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
      console.info();
      console.info(Log.Entry.toString(Pkg, input, { pad: true }));
    },
    toString(Pkg: t.Pkg, input: t.StringPath, options: { pad?: boolean } = {}) {
      input = input.replace(/^\.\//, ''); // trim leading "./" relative prefix (reduce visual noise).
      const text = `
${c.gray(`Module:   ${ViteLog.Module.toString(Pkg)}`)}
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
    toString(args: BuildArgs) {
      const { ok, stdio, dirs, pkg, pkgSize, hash, totalSize, elapsed } = args;
      const bundle = ViteLog.Bundle.toString({ ok, dirs, totalSize, pkg, pkgSize, hash, elapsed });
      const text = `${stdio}\n${bundle}`;
      return ViteLog.pad(text, args.pad);
    },
  },

  /**
   * Info
   */
  Info: {
    toString(args: { pkg: t.Pkg; dist?: t.DistPkg; url: string; pad?: boolean }) {
      const { pkg, dist } = args;
      const url = new URL(args.url);
      const mod = ViteLog.Module.toString(pkg);
      const port = c.bold(c.brightCyan(url.port));
      const href = `${url.protocol}//${url.hostname}:${port}/`;
      const text = `
${c.gray(`Module   ${mod}`)}
${c.cyan(`         ${href}`)}
          `;
      return ViteLog.pad(text, args.pad);
    },
  },

  /**
   * Help
   */
  Help: {
    toString(args: {
      pkg: t.Pkg;
      dist?: t.DistPkg;
      ws?: t.ViteDenoWorkspace;
      paths: t.ViteConfigPaths;
      url: string;
      pad?: boolean;
    }) {
      const { pkg, dist, paths, url, pad, ws } = args;
      const hr = c.brightGreen(c.bold('─'.repeat(60)));
      const key = (text: string) => c.bold(c.white(text));
      const digest = ViteLog.digest(args.dist?.hash.digest);
      const input = paths.app.entry;
      const outDir = paths.app.outDir;

      let text = `
${c.brightGreen(c.bold('Info'))}
${hr}
${ws?.toString() || ''}

${Log.Info.toString({ pkg, dist, url, pad })}      
         ${c.green('↓')}
         ${c.green('input')}    ${Path.trimCwd(input)}
         ${c.white('output')}   ${Path.trimCwd(outDir)} ${digest}


${c.green(c.bold('Options'))}: 
${hr}
 Quit   ${key('ctrl + c')}
 Clear  ${key('k')}
 Open   ${key('o')}  ${c.dim('← (in browser)')}
 Info   ${key('i')}
`;
      text = text.trim();
      return ViteLog.pad(c.gray(text), args.pad);
    },
  },
} as const;

/**
 * Helpers
 */
const wrangle = {
  fmtPath(path: string = '') {
    path = Path.trimCwd(path.trim());
    if (path === '' || path === '.') path = './';
    if (path === './') path = `./ ${c.dim('(root directory)')}`;
    return c.gray(path);
  },
} as const;
