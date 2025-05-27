import { type t, Arr, c, Cli, Path, Str, Num } from './common.ts';
import { Dist } from './m.Pkg.Dist.ts';
import { toModuleString } from './u.log.ts';

export const children: t.PkgDistLog['children'] = async (dir, dist) => {
  const paths = Object.keys(dist.hash.parts);
  const { CompositeHash } = await import('./common.ts'); // NB: avoid cyclicic import error.

  /**
   * Calculate:
   */
  const subPackages = paths.filter((path) => path.includes('/dist.json'));
  if (subPackages.length === 0) return '';

  function toContent(dist: t.DistPkg, childBundles: t.StringPath[]) {
    const dirs = Arr.uniq(
      paths
        .map((path) => Path.dirname(path))
        .filter((path) => !childBundles.some((p) => path.startsWith(Path.dirname(p))))
        .filter((path) => !['.'].includes(path)),
    );

    const fromUri = CompositeHash.Uri.File.fromUri;
    const files = dirs
      .map((path) => {
        return paths
          .filter((p) => p.startsWith(`${path}/`))
          .map((path) => ({ path, uri: dist.hash.parts[path] }))
          .map((item) => ({ ...item, uri: fromUri(item.uri) }));
      })
      .flat();

    const bytes = files.reduce((acc, file) => acc + (file.uri.bytes ?? 0), 0);
    return {
      bytes,
      dirs,
      length: files.length,
      get files() {
        return files;
      },
    } as const;
  }

  const totalBytes = {
    packages: dist.build.size.total,
    subpackages: 0,
    get percent() {
      return totalBytes.packages > 0 ? totalBytes.subpackages / totalBytes.packages : 0;
    },
  };

  /**
   * Build table:
   */
  const table = Cli.table([c.gray(' │')]);
  const content = toContent(dist, subPackages);

  // Child package list:
  for (const [index, path] of subPackages.entries()) {
    const isLast = index === subPackages.length - 1;
    const child = (await Dist.load(Path.join(dir, Path.dirname(path)))).dist;
    if (child) {
      const prefix = isLast && content.length === 0 ? '└──' : '├──';
      const mod = toModuleString(child.pkg);
      const bytes = child.build.size.total;
      totalBytes.subpackages += bytes;
      const size = Str.bytes(bytes);
      const hx = c.green(`#${child.hash.digest.slice(-5)}`);
      const version = c.gray(`sha256:${hx}`);
      const dir = c.gray(Path.dirname(path));
      table.push([c.gray(` ${prefix} ${mod}`), dir, size, version]);
    }
  }

  // Content files:
  if (content.length > 0) {
    const percent = Num.Percent.toString(totalBytes.percent);
    const label = `${c.italic('content files')} ← (${percent})`;
    const size = Str.bytes(content.bytes);
    table.push([c.gray(` ${'└──'} ${label}`), '', size]);
  }

  // Total sum:
  if (totalBytes.subpackages > 0) {
    const total = Str.bytes(totalBytes.subpackages + content.bytes);
    const underline = c.gray('─'.repeat(total.length));
    table.push(['', '', underline]);
    table.push(['', '', c.gray(total)]);
  }

  // Finish up.
  return table.toString().trim();
};
