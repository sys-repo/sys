import { type t, c, Path, Semver, Str, Time } from './common.ts';
import { digest, pad } from './u.ts';

export const Bundle: t.ViteLogLib['Bundle'] = {
  log(args) {
    console.info(Bundle.toString(args));
  },

  toString(args) {
    const { ok, dirs, pkg, hash } = args;
    const size = Str.bytes(args.totalSize);
    const titleColor = ok ? c.brightGreen : c.brightYellow;

    const input = Path.trimCwd(dirs.in) || './';
    const outDir = Path.trimCwd(dirs.out);
    const elapsed = args.elapsed ? Time.duration(args.elapsed).toString({ round: 1 }) : '-';
    const tx = digest(hash);

    let strPkg = ``;
    if (pkg) {
      const strVersion = Semver.Fmt.colorize(pkg.version);
      const strModule = `${c.white(c.bold(pkg.name))}${c.dim('@')}${strVersion}`;
      strPkg = strModule;
      if (args.pkgSize) strPkg += ` /pkg:${c.white(Str.bytes(args.pkgSize))}`;
    }

    let text = `
${titleColor(c.bold('Bundle'))}    ${titleColor(size)} ${c.gray(`(${elapsed})`)}
${c.gray(`pkg:      ${strPkg}`)}
${c.gray(`in:       ${input}`)}
${c.gray(`out:      ${outDir.replace(/\/$/, '')}/dist.json`)} ${tx}
`;

    return pad(text.trim(), args.pad);
  },
};
