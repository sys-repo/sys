import { c, type t } from './common.ts';

type BuildArgs = {
  ok: boolean;
  stdio: string;
  paths: t.ViteConfigPaths;
  pad?: boolean;
  Pkg?: t.Pkg;
};

/**
 * Logging Display Helpers.
 */
export const Log = {
  /* Module. */
  module: {
    log: (Pkg: t.Pkg) => console.info(Log.module.toString(Pkg)),
    toString(Pkg: t.Pkg) {
      return c.gray(`${c.white(c.bold(Pkg.name))} ${Pkg.version}`);
    },
  },

  /* Startup entry. */
  entry: {
    log: (Pkg: t.Pkg, input: t.StringPath) => console.info(Log.entry.toString(Pkg, input)),
    toString(Pkg: t.Pkg, input: t.StringPath, options: { pad?: boolean } = {}) {
      input = input.replace(/^\.\//, ''); // trim leading "./" relative prefix (reduce visual noise).
      const text = `
${c.gray(`Module:       ${Log.module.toString(Pkg)}`)}
${c.brightGreen(`entry point:  ${c.gray(input)}`)}
    `.trim();
      return Fmt.pad(text, options.pad);
    },
  },

  /* Build log */
  build: {
    log: (args: BuildArgs) => Log.build.toString(args),
    toString(args: BuildArgs) {
      const { ok, stdio, paths, Pkg } = args;
      const titleColor = ok ? c.brightGreen : c.brightYellow;
      let text = `
${stdio}
${titleColor(c.bold('Bundle'))}
${c.gray(`input:  ${paths.input}`)}
${c.gray(`output: ${paths.outDir}`)}
`.trim();
      if (Pkg) text += c.gray(`\nmodule: ${Log.module.toString(Pkg)}`);
      if (args.pad) text = `\n${text}\n`;
      return text;
    },
  },
} as const;

/**
 * Helpers
 */
const Fmt = {
  pad: (text: string, pad: boolean = true) => (pad ? `\n${text}\n` : text),
};
