import { c, type t } from './common.ts';

export const Log = {
  /**
   * Startup log.
   */
  entry(pkg: t.Pkg, input: t.StringPath) {
    input = input.replace(/^\.\//, ''); // trim leading "./" relative prefix (reduce visual noise).
    console.info();
    console.info(c.gray(`Module:       ${Log.toModuleString(pkg)}`));
    console.info(c.brightGreen(`entry point:  ${c.gray(input)}`));
    console.info();
  },

  toModuleString(pkg: t.Pkg) {
    return c.gray(`${c.white(c.bold(pkg.name))} ${pkg.version}`);
  },

  /**
   * Built bundle results.
   */
  toBuiltString(args: {
    ok: boolean;
    stdio: string;
    paths: t.ViteConfigPaths;
    log?: boolean;
    pad?: boolean;
    Pkg?: t.Pkg;
  }) {
    const { ok, stdio, paths, Pkg } = args;
    const titleColor = ok ? c.brightGreen : c.brightYellow;
    let text = `
${stdio}
${titleColor(c.bold('Bundle'))}
${c.gray(`output: ${paths.outDir}`)}
`;

    text = text.trim();
    if (Pkg) text += c.gray(`\nmodule: ${Log.toModuleString(Pkg)}`);

    if (args.pad) text = `\n${text}\n`;
    if (args.log) console.info(text);
    return text;
  },
} as const;
