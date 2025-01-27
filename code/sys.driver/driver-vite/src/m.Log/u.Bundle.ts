import { type t, c, Path, Str, Time } from './common.ts';

import { digest, pad } from './u.ts';

export const Bundle: t.ViteLogLib['Bundle'] = {
  log(args) {
    console.info(Bundle.toString(args));
  },

  toString(args) {
    const { ok, dirs, pkg, hash } = args;
    const size = Str.bytes(args.bytes);
    const titleColor = ok ? c.brightGreen : c.brightYellow;

    const input = Path.trimCwd(dirs.in) || './';
    const outDir = Path.trimCwd(dirs.out);
    const elapsed = args.elapsed ? Time.duration(args.elapsed).toString({ round: 1 }) : '-';
    const tx = digest(hash);

    let text = `
${titleColor(c.bold('Bundle'))}    ${titleColor(size)} ${c.gray(`(${elapsed})`)}
${c.gray(`in:       ${input}`)}
${c.gray(`out:      ${outDir}/dist.json`)} ${tx}
`;
    text = text.trim();
    if (pkg) {
      const mod = c.white(c.bold(pkg.name));
      text += c.gray(`\npkg:      ${mod} ${c.cyan(pkg.version)}`);
    }
    return pad(text, args.pad);
  },
};
