import { type t, c, Cli, CompositeHash, Fs, HashFmt, Path, Str } from './common.ts';

const isCodePath = (path: string) => path.startsWith('pkg/') || path.includes('/pkg/');

/**
 * String:
 */
export const toString: t.PkgDistFsLib['toString'] = (dist, options = {}) => {
  if (!dist) return c.yellow(`dist: nothing to display`);

  const outDir = options.dir ?? './dist';
  const pkg = dist.pkg;
  const builder = dist.build.builder;
  const pkgBytes = CompositeHash.size(dist.hash.parts, (e) => isCodePath(e.path));

  const title = c.green(options.title ?? 'Production Bundle');
  const totalSize = c.white(Str.bytes(dist.build.size.total));
  const pkgSize = c.gray(Str.bytes(pkgBytes));

  const hx = digest(dist.hash.digest);
  const distPath = Path.trimCwd(Path.join(outDir, 'dist.json'));
  const d = Fs.toFile(distPath);
  const distPathFmt = `${c.gray(`${Path.dirname(d.relative)}/`)}${c.green(d.file.name)}`;
  const fmtPkg = `${c.white(pkg.name)}@${c.cyan(pkg.version)}`;

  const table = Cli.table([]);
  const push = (label: string, value: string) => table.push([c.gray(label), value]);

  push(c.bold(fmtPkg), '');
  push('size:', totalSize);
  push('size:/pkg', pkgSize);
  push('dist:', c.gray(`${distPathFmt} ${hx}`));
  push('builder:', c.gray(`${c.white(builder.name)}@${c.cyan(builder.version)}`));

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
