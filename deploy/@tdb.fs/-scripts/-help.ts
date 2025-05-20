import { type t, c, Cli, Fs, Pkg, Str } from './common.ts';

const toModuleString = (pkg: t.Pkg) => c.gray(`${c.white(pkg.name)}@${c.cyan(pkg.version)}`);

export async function logChildren(rootDir: t.StringDir, parent: t.DistPkg) {
  const paths = Object.keys(parent.hash.parts);
  const children = paths.filter((path) => path.includes('/dist.json'));
  if (children.length === 0) return;

  const table = Cli.table([c.gray(' │')]);
  for (const [index, path] of children.entries()) {
    const isLast = index === children.length - 1;
    const child = (await Pkg.Dist.load(Fs.join(rootDir, Fs.dirname(path)))).dist;
    if (child) {
      const prefix = isLast ? '└──' : '├──';
      const mod = toModuleString(child.pkg);
      const size = Str.bytes(child.build.size.total);
      const hx = c.green(`#${child.hash.digest.slice(-5)}`);
      const version = c.gray(`sha256:${hx}`);
      table.push([` ${c.gray(prefix)} ${mod}`, size, version]);
    }
  }
  console.info(table.toString().trim());
}

export async function logHelp(rootDir: t.StringDir) {
  const { dist } = await Pkg.Dist.load(rootDir);
  if (!dist) {
    console.info(c.yellow(`No "/dist" folder found`));
    return;
  }

  /**
   * Root package:
   */
  console.info();
  Pkg.Dist.log(dist);

  /**
   * Sub-packages:
   */
  await logChildren(rootDir, dist);
  console.info();
}

/**
 * Run:
 */
logHelp('./dist');
