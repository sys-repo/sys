import { type t, Fs } from './common.ts';
import { verifyDist } from './u.verify.ts';

export async function loadTarget(options: t.DenoEntry.ServeOptions) {
  const cwd = Fs.resolve(options.cwd ?? Fs.cwd());
  const target = {
    absolute: trustedPath(cwd, options.targetDir, 'targetDir'),
    relative: ensureDotRelativeDir(options.targetDir),
  };

  const dist = {
    absolute: trustedPath(target.absolute, options.distDir ?? 'dist', 'distDir'),
  };

  const entry = {
    absolute: trustedPath(target.absolute, './src/entry.ts', 'entry.ts'),
  };

  const pkgPath = trustedPath(target.absolute, './src/pkg.ts', 'pkg.ts');
  const pkgModule = await import(Fs.Path.toFileUrl(pkgPath).href);
  const sourcePkg = pkgModule.pkg;
  const distPkg = await verifyDist(dist.absolute);
  const pkg = distPkg.pkg || sourcePkg;
  const hash = distPkg.hash.digest;
  const hasEntry = await Fs.exists(entry.absolute);

  return {
    dist,
    entry,
    hasEntry,
    hash,
    pkg,
    target,
  } as const;
}

function trustedPath(root: t.StringPath, rel: t.StringRelativePath, label: string) {
  const path = Fs.resolve(Fs.join(root, rel));
  if (path !== root && !path.startsWith(Fs.join(root, ''))) {
    throw new Error(`DenoEntry.serve: '${label}' escapes root '${root}': ${rel}`);
  }
  return path;
}

function ensureDotRelativeDir(dir: t.StringDir) {
  return (dir.startsWith('./') ? dir : `./${dir}`) as t.StringRelativeDir;
}
