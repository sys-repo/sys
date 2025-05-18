import { Pkg as PkgBase } from '@sys/std/pkg';
import { type t, c, Cli, Date, Fs, HashFmt, Num, Path, Str, Time } from './common.ts';

/**
 * String:
 */
export const toString: t.PkgDistFsLib['toString'] = (dist, options = {}) => {
  if (!dist) return c.yellow(`dist: nothing to display`);

  const outDir = options.dir ?? './dist';
  const pkg = dist.pkg;
  const builder = dist.build.builder;
  const builderPkg = PkgBase.toPkg(builder);

  const title = c.green(options.title ?? 'Production Bundle');
  const totalSize = c.white(Str.bytes(dist.build.size.total));
  const pkgSize = c.gray(Str.bytes(dist.build.size.pkg));
  const timeAgo = Time.elapsed(dist.build.time);

  const buildTime = Date.format(dist.build.time, 'y MMM d, h:mmaaa');

  const a = dist.build.size.total;
  const b = dist.build.size.pkg;
  const diff = a === 0 ? 0 : Num.toString((b / a) * 100, 0);
  const percentDiff = c.gray(`↑ ${diff}%`);

  const hx = digest(dist.hash.digest);
  const distPath = Path.trimCwd(Path.join(outDir, 'dist.json'));
  const d = Fs.toFile(distPath);
  const distPathFmt = `${c.gray(`${Path.dirname(d.relative)}/`)}${c.green(d.file.name)}`;
  const fmtPkg = `${c.white(pkg.name)}@${c.cyan(pkg.version)}`;

  const table = Cli.table([]);
  const push = (label: string, value: string) => table.push([c.gray(label), value]);

  push(c.bold(fmtPkg), '');
  push('size:', totalSize);
  push('size:/pkg/*', c.gray(`${pkgSize} (${percentDiff})`));
  push('dist:', c.gray(`${distPathFmt} ${hx}`));
  push('timestamp:', c.gray(`${buildTime} | ${timeAgo} ago`));
  push('builder:', c.gray(`${c.white(builderPkg.name)}@${c.cyan(builderPkg.version)}`));

  let res = '';
  const line = (text: string) => (res += text + '\n');
  line(c.bold(title));
  line(table.toString().trim());

  return res.trim();
};

/**
 * Log:
 */
export const log: t.PkgDistFsLib['log'] = (dist, options = {}) => {
  console.info(toString(dist, options));
};

/**
 * Helpers:
 */
const digest = (hash?: t.StringHash): string => {
  if (!hash) return '';
  const uri = HashFmt.digest(hash);
  return c.gray(`${c.green('←')} ${uri}`);
};
