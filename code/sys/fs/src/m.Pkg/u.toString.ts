import { Pkg } from '@sys/std/pkg';
import { type t, c, Cli, Date, Fs, HashFmt, Num, Path, Str, Time } from './common.ts';

/**
 * Log `toString` to the console.
 */
export const log: t.PkgDistFsLib['log'] = async (dist, options = {}) => {
  console.info(toString(dist, options));
};

/**
 * String:
 */
export const toString: t.PkgDistFsLib['toString'] = (dist, options = {}) => {
  if (!dist) return c.yellow(`dist: nothing to display`);

  // Input:
  const outDir = options.dir ?? './dist';
  const pkg = dist.pkg;
  const builder = dist.build.builder;
  const builderPkg = Pkg.toPkg(builder);

  // Prepare strings:
  const title = options.title === false ? '' : c.green(options.title ?? 'Production Bundle');
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

  /**
   * Build table:
   */
  const table = Cli.table([]);
  const push = (label: string, value: string) => table.push([c.gray(label), '    ', value]);

  push('size:', totalSize);
  push('size:/pkg/*', c.gray(`${pkgSize} (${percentDiff})`));
  push('dist:', c.gray(`${distPathFmt} ${hx}`));
  push('timestamp:', c.gray(`${buildTime} | ${timeAgo} ago`));
  push('builder:', toModuleString(builderPkg));

  /**
   * Render string:
   */
  let res = '';
  const line = (text: string) => {
    text = text.trim();
    if (text) res += text + '\n';
  };
  if (title) line(c.bold(title));
  line(c.bold(toModuleString(pkg)));
  line(table.toString());
  res = res.trim();

  const indent = options.indent ?? 0;
  if (indent) {
    res = res
      .split('\n')
      .map((line) => ' '.repeat(indent) + line)
      .join('\n');
  }

  // Finish up.
  return res;
};

/**
 * Helpers:
 */
const toModuleString = (pkg: t.Pkg) => c.gray(`${c.white(pkg.name)}@${c.cyan(pkg.version)}`);
const digest = (hash?: t.StringHash): string => {
  if (!hash) return '';
  const uri = HashFmt.digest(hash);
  return c.gray(`${c.green('←')} ${uri}`);
};
