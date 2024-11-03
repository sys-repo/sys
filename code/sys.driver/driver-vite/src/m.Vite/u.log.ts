import { Hash, Path, Str, Time, c, type t } from './common.ts';

type BuildArgs = {
  ok: boolean;
  stdio: string;
  paths: t.ViteConfigPaths;
  bytes: number;
  pad?: boolean;
  pkg?: t.Pkg;
  hash?: t.StringHash;
  elapsed?: t.Msecs;
};

/**
 * Logging helpers.
 */
export const Log = {
  /**
   * Module
   */
  Module: {
    log: (Pkg: t.Pkg) => console.info(Log.Module.toString(Pkg)),
    toString(Pkg: t.Pkg) {
      return c.gray(`${c.white(c.bold(Pkg.name))} ${Pkg.version}`);
    },
  },

  /**
   * Startup entry
   */
  Entry: {
    log(Pkg: t.Pkg, input: t.StringPath) {
      console.info();
      console.info(Log.Entry.toString(Pkg, input, { pad: true }));
    },
    toString(Pkg: t.Pkg, input: t.StringPath, options: { pad?: boolean } = {}) {
      input = input.replace(/^\.\//, ''); // trim leading "./" relative prefix (reduce visual noise).
      const text = `
${c.gray(`Module:   ${Log.Module.toString(Pkg)}`)}
${c.brightGreen(`entry:    ${c.gray(input)}`)}
    `;
      return wrangle.res(text, options.pad);
    },
  },

  /**
   * Build log
   */
  Build: {
    log: (args: BuildArgs) => {
      console.info(Log.Build.toString(args));
    },
    toString(args: BuildArgs) {
      const { ok, stdio, paths, pkg, hash } = args;
      const cwd = Path.resolve();
      const size = Str.bytes(args.bytes);
      const titleColor = ok ? c.brightGreen : c.brightYellow;

      const input = paths.input.slice(cwd.length + 1);
      const outDir = paths.outDir.slice(cwd.length + 1);
      const elapsed = args.elapsed ? Time.duration(args.elapsed).toString({ round: 1 }) : '-';

      let digest = '';
      if (hash) {
        const uri = Hash.Console.digest(hash);
        digest = c.gray(`${c.green('←')} ${uri}`);
      }

      let text = `
${stdio}
${titleColor(c.bold('Bundle'))}    ${titleColor(size)} ${c.gray(`(${elapsed})`)}
${c.gray(`in:       ${input}`)}
${c.gray(`out:      ${outDir}/dist.json`)} ${digest}
`;
      text = text.trim();
      if (pkg) {
        const mod = c.white(c.bold(pkg.name));
        text += c.gray(`\npkg:      ${mod} ${pkg.version}`);
      }
      return wrangle.res(text, args.pad);
    },
  },

  /**
   * Info
   */
  Info: {
    toString(args: { pkg: t.Pkg; url: string; pad?: boolean }) {
      const { pkg } = args;
      const url = new URL(args.url);
      const mod = Log.Module.toString(pkg);
      const port = c.bold(c.brightCyan(url.port));
      const href = `${url.protocol}//${url.hostname}:${port}/`;
      const text = `
${c.gray(`Module   ${mod}`)}
${c.cyan(`         ${href}`)}
          `;
      return wrangle.res(text, args.pad);
    },
  },

  /**
   * Help
   */
  Help: {
    toString(args: {
      pkg: t.Pkg;
      ws: t.ViteDenoWorkspace;
      paths: t.ViteConfigPaths;
      url: string;
      pad?: boolean;
    }) {
      const { pkg, paths, url, pad, ws } = args;
      const hr = c.brightGreen(c.bold('─'.repeat(60)));
      const key = (text: string) => c.bold(c.white(text));
      const cwd = Path.resolve();
      let text = `
${c.brightGreen(c.bold('Info'))}
${hr}
${ws.toString()}

${Log.Info.toString({ pkg, url, pad })}      
         ↓
         ${c.white('input')}    ${paths.input.slice(cwd.length)}
         ${c.cyan('output')}   ${paths.outDir.slice(cwd.length)}


${c.green(c.bold('Options'))}: 
${hr}
 Quit   ${key('ctrl + c')}
 Clear  ${key('k')}
 Open   ${key('o')}  ${c.dim('← (in browser)')}
 Info   ${key('i')}
`;
      text = text.trim();
      return wrangle.res(c.gray(text), args.pad);
    },
  },
} as const;

/**
 * Helpers
 */
const wrangle = {
  res(text: string, pad?: boolean) {
    text = text.trim();
    return pad ? `\n${text}\n` : text;
  },
} as const;
