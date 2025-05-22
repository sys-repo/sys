import { type t, c, Cli, Path, Str } from './common.ts';
import { Dist } from './m.Pkg.Dist.ts';
import { toModuleString } from './u.log.ts';

export const children: t.PkgDistLog['children'] = async (dir, dist) => {
  const paths = Object.keys(dist.hash.parts);
  const children = paths.filter((path) => path.includes('/dist.json'));
  if (children.length === 0) return '';

  const table = Cli.table([c.gray(' │')]);
  for (const [index, path] of children.entries()) {
    const isLast = index === children.length - 1;
    const child = (await Dist.load(Path.join(dir, Path.dirname(path)))).dist;
    if (child) {
      const prefix = isLast ? '└──' : '├──';
      const mod = toModuleString(child.pkg);
      const size = Str.bytes(child.build.size.total);
      const hx = c.green(`#${child.hash.digest.slice(-5)}`);
      const version = c.gray(`sha256:${hx}`);
      const dir = c.gray(Path.dirname(path));
      table.push([c.gray(` ${prefix} ${mod}`), dir, size, version]);
    }
  }
  return table.toString().trim();
};
