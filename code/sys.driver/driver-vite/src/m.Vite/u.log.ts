import { Path, c, type t } from './common.ts';

type BuildArgs = {
  ok: boolean;
  stdio: string;
  paths: t.ViteConfigPaths;
  pad?: boolean;
  Pkg?: t.Pkg;
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
${c.gray(`Module:       ${Log.Module.toString(Pkg)}`)}
${c.brightGreen(`entry point:  ${c.gray(input)}`)}
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
      const { ok, stdio, paths, Pkg } = args;
      const titleColor = ok ? c.brightGreen : c.brightYellow;
      let text = `
${stdio}
${titleColor(c.bold('Bundle'))}
${c.gray(` input:  ${paths.input}`)}
${c.gray(` output: ${paths.outDir}`)}
`;
      text = text.trim();
      if (Pkg) {
        const jsr = `https://jsr.io/${Pkg.name}`;
        text += c.gray(`\n pkg:    ${Log.Module.toString(Pkg)}  ${c.white('→')}  ${jsr}`);
      }
      return wrangle.res(text, args.pad);
    },
  },

  /**
   * Info
   */
  Info: {
    toString(args: { Pkg: t.Pkg; url: string; pad?: boolean }) {
      const { Pkg } = args;
      const url = new URL(args.url);
      const mod = Log.Module.toString(Pkg);
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
      Pkg: t.Pkg;
      ws: t.ViteDenoWorkspace;
      paths: t.ViteConfigPaths;
      url: string;
      pad?: boolean;
    }) {
      const { Pkg, paths, url, pad, ws } = args;
      const hr = c.brightGreen(c.bold('─'.repeat(60)));
      const key = (text: string) => c.bold(c.white(text));
      const cwd = Path.resolve();
      let text = `
${c.brightGreen(c.bold('Info'))}
${hr}
${ws.toString()}

${Log.Info.toString({ Pkg, url, pad })}      
         ↓
         ${c.green('input')}    ${paths.input.slice(cwd.length)}
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
