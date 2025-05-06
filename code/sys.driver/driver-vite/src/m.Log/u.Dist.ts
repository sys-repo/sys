import { type t, c, Cli, CompositeHash, Fs, Path, Str } from './common.ts';
import { digest } from './u.ts';

export const Dist: t.ViteLogLib['Dist'] = {
  log(dist, options = {}) {
    console.info(Dist.toString(dist, options));
  },

  toString(dist, options = {}) {
    const outDir = options.dirs?.out ?? '.';
    const pkg = dist.pkg;
    const pkgBytes = CompositeHash.size(dist.hash.parts, (e) => e.path.startsWith('pkg/'));

    const title = c.green(c.bold(options.title ?? 'Production Bundle'));
    const totalSize = c.white(Str.bytes(dist.build.size.total));
    const pkgSize = c.gray(Str.bytes(pkgBytes));
    console.info(title);

    const hx = digest(dist.hash.digest);
    const distPath = Path.trimCwd(Path.join(outDir, 'dist.json'));
    const d = Fs.toFile(distPath);
    const distPathFmt = `${c.gray(`${Path.dirname(d.relative)}/`)}${c.green(d.file.name)}`;
    const pkgNameFmt = c.white(c.bold(pkg.name));

    const table = Cli.table([]);
    const push = (label: string, value: string) => table.push([c.gray(label), value]);

    push('size:', totalSize);
    push('size:/pkg', pkgSize);
    push('dist:', c.gray(`${distPathFmt} ${hx}`));
    push('builder:', c.gray(`https://jsr.io/${pkgNameFmt}@${c.cyan(c.bold(pkg.version))}`));

    return table.toString().trim();
  },
};
