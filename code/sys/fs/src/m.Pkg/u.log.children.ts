import { Arr, c, CliFmt, CliTable, Fs, Num, Path, Pkg, Str, type t } from './common.ts';
import { Dist } from './m.Pkg.Dist.ts';
import { toModuleString } from './u.log.ts';

export const children: t.PkgDistLog['children'] = async (dir, dist) => {
  const paths = Object.keys(dist.hash.parts);
  const { CompositeHash } = await import('./common.ts'); // NB: avoid cyclicic import error.

  /**
   * Calculate:
   */
  const glob = Fs.glob(dir, { includeDirs: false });
  const entries = await glob.find('**/dist.json');
  const subPackages = entries
    .map((entry) => Path.relative(dir, entry.path))
    .map((rel) => Str.trimLeadingDotSlash(rel))
    .filter((rel) => rel !== 'dist.json' && rel.endsWith('/dist.json'));
  if (subPackages.length === 0) return '';

  function toContent(dist: t.DistPkg, childBundles: t.StringPath[]) {
    const childRoots = Arr.uniq(childBundles.map((p) => Path.dirname(p)));

    // Compute content files ONCE (unique file paths), excluding any child bundle roots.
    // This avoids double-counting caused by iterating nested dirs and re-including
    // descendant files for each ancestor dir.
    const includedPaths = paths
      .filter((p) => !childRoots.some((root) => p.startsWith(`${root}/`)))
      .filter((p) => !['.'].includes(Path.dirname(p)));

    const fromUri = CompositeHash.Uri.File.fromUri;
    const files = includedPaths
      .map((path) => ({ path, uri: dist.hash.parts[path] }))
      .map((item) => ({ ...item, uri: fromUri(item.uri) }));

    const dirs = Arr.uniq(includedPaths.map((p) => Path.dirname(p))).filter(
      (p) => !['.'].includes(p),
    );
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
  const table = CliTable.create([c.gray(c.dim(` ${CliFmt.Tree.vert}`))]);
  const content = toContent(dist, subPackages);

  // Child package list:
  for (const [index, path] of subPackages.entries()) {
    const isLast = index === subPackages.length - 1;
    const child = (await Dist.load(Path.join(dir, Path.dirname(path)))).dist;
    if (child) {
      const branch = CliFmt.Tree.branch(isLast && content.length === 0, 1);
      const childPkg = child.pkg ?? Pkg.toPkg(child.build.builder);
      const mod = toModuleString(childPkg);
      const size = child.build.size;
      totalBytes.subpackages += size.total;

      const fmtTotalSize = `${Str.bytes(size.total)}`;
      const fmtPkgSize = c.gray(`/pkg: ${Str.bytes(size.pkg)}`);

      const hx = c.green(`#${child.hash.digest.slice(-5)}`);
      const version = c.gray(`sha256:${hx}`);
      const dir = c.gray(Path.dirname(path));

      table.push([c.gray(` ${c.dim(branch)} ${mod}`), dir, fmtTotalSize, fmtPkgSize, version]);
    }
  }

  // Content files:
  if (content.length > 0) {
    const percent = Num.Percent.toString(totalBytes.percent);
    const label = `${c.italic('static content')} ${c.dim(`← (${percent})`)}`;
    const size = Str.bytes(content.bytes);
    const branch = c.dim(CliFmt.Tree.branch(true, 1));
    table.push([c.gray(` ${branch} ${label}`), '', size]);
  }

  // Total sum:
  if (totalBytes.subpackages > 0) {
    const total = Str.bytes(totalBytes.subpackages + content.bytes);
    const underline = c.gray('─'.repeat(total.length));
    table.push(['', '', underline]);
    table.push(['', '', c.gray(total)]);
  }

  // Finish up.
  return Str.trimEdgeNewlines(String(table));
};
