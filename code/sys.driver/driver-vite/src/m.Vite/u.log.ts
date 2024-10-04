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
    log: (Pkg: t.Pkg, input: t.StringPath) => console.info(Log.Entry.toString(Pkg, input)),
    toString(Pkg: t.Pkg, input: t.StringPath, options: { pad?: boolean } = {}) {
      input = input.replace(/^\.\//, ''); // trim leading "./" relative prefix (reduce visual noise).
      const res = `
${c.gray(`Module:       ${Log.Module.toString(Pkg)}`)}
${c.brightGreen(`entry point:  ${c.gray(input)}`)}
    `.trim();
      return options.pad ? `\n${res}\n` : res;
    },
  },

  /**
   * Build log
   */
  Build: {
    log: (args: BuildArgs) => Log.Build.toString(args),
    toString(args: BuildArgs) {
      const { ok, stdio, paths, Pkg } = args;
      const titleColor = ok ? c.brightGreen : c.brightYellow;
      let res = `
${stdio}
${titleColor(c.bold('Bundle'))}
${c.gray(`input:  ${paths.input}`)}
${c.gray(`output: ${paths.outDir}`)}
`.trim();
      if (Pkg) res += c.gray(`\nmodule: ${Log.Module.toString(Pkg)}`);
      return args.pad ? `\n${res}\n` : res;
    },
  },
} as const;
