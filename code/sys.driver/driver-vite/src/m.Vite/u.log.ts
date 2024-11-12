import { ViteLog } from '../m.Log/mod.ts';
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
${c.brightGreen(`entry:    ${c.gray(input)}`)}
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
      const { ok, stdio, dirs, pkg, hash, bytes, elapsed } = args;
      const bundle = ViteLog.Bundle.toString({ ok, bytes, dirs, pkg, hash, elapsed });
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
      const cwd = Path.resolve();
      const digest = ViteLog.digest(args.dist?.hash.digest);

      let text = `
${c.brightGreen(c.bold('Info'))}
${hr}
${ws?.toString() || ''}

${Log.Info.toString({ pkg, dist, url, pad })}      
         ${c.green('↓')}
         ${c.green('input')}    ./${paths.input.slice(cwd.length + 1)}
         ${c.white('output')}   ./${paths.outDir.slice(cwd.length + 1)} ${digest}


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
