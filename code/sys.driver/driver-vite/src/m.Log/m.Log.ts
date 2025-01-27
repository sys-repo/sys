import { type t, c, HashFmt, Path, Str, Time } from '../common.ts';

export const ViteLog: t.ViteLogLib = {
  digest(hash?: t.StringHash) {
    if (!hash) return '';
    const uri = HashFmt.digest(hash);
    return c.gray(`${c.green('←')} ${uri}`);
  },

  pad(text, pad) {
    text = text.trim();
    return pad ? `\n${text}\n` : text;
  },

  Module: {
    log: (pkg: t.Pkg) => console.info(ViteLog.Module.toString(pkg)),
    toString(pkg: t.Pkg) {
      return c.gray(`${c.white(c.bold(pkg.name))} ${pkg.version}`);
    },
  },

  Bundle: {
    log(args) {
      console.info(ViteLog.Bundle.toString(args));
    },

    toString(args) {
      const { ok, dirs, pkg, hash } = args;
      const size = Str.bytes(args.bytes);
      const titleColor = ok ? c.brightGreen : c.brightYellow;

      const input = Path.trimCwd(dirs.in) || './';
      const outDir = Path.trimCwd(dirs.out);
      const elapsed = args.elapsed ? Time.duration(args.elapsed).toString({ round: 1 }) : '-';
      const digest = ViteLog.digest(hash);

      let text = `
${titleColor(c.bold('Bundle'))}    ${titleColor(size)} ${c.gray(`(${elapsed})`)}
${c.gray(`in:       ${input}`)}
${c.gray(`out:      ${outDir}/dist.json`)} ${digest}
`;
      text = text.trim();
      if (pkg) {
        const mod = c.white(c.bold(pkg.name));
        text += c.gray(`\npkg:      ${mod} ${pkg.version}`);
      }
      return ViteLog.pad(text, args.pad);
    },
  },
};
