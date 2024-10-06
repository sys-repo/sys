import { c, type t } from './common.ts';

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
      let res = `
${c.gray(`Module:       ${Log.Module.toString(Pkg)}`)}
${c.brightGreen(`entry point:  ${c.gray(input)}`)}
    `;
      res = res.trim();
      return options.pad ? `\n${res}\n` : res;
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
      let res = `
${stdio}
${titleColor(c.bold('Bundle'))}
${c.gray(` input:  ${paths.input}`)}
${c.gray(` output: ${paths.outDir}`)}
`;
      res = res.trim();
      if (Pkg) {
        const jsr = `https://jsr.io/${Pkg.name}`;
        res += c.gray(`\n pkg:    ${Log.Module.toString(Pkg)}  ${c.white('→')}  ${jsr}`);
      }
      return args.pad ? `\n${res}\n` : res;
    },
  },

  /**
   * Info
   */
  Info: {
    toString(args: { Pkg: t.Pkg; paths: t.ViteConfigPaths; url: string; pad?: boolean }) {
      const { Pkg } = args;
      const url = new URL(args.url);
      const mod = Log.Module.toString(Pkg);
      const port = c.bold(c.brightCyan(url.port));
      const href = `${url.protocol}//${url.hostname}:${port}/`;
      let res = `
${c.gray(`Module   ${mod}`)}
${c.cyan(`         ${href}`)}
          `;
      res = res.trim();
      return args.pad ? `\n${res}\n` : res;
    },
  },
} as const;
