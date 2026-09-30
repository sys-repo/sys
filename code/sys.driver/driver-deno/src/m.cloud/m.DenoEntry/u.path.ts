import { Fs, type t } from './common.ts';
import { checkSelfReportedDist } from './u.checkSelfReported.ts';

export async function loadTarget(options: t.DenoEntry.ServeOptions) {
  // Canonicalize the working-directory anchor, not the selected target or Dist subtree.
  const cwd = await Fs.realPath(Fs.resolve(options.cwd ?? Fs.cwd()));
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
  const hasEntry = await Fs.exists(entry.absolute);

  if (hasEntry) {
    return {
      dist,
      entry,
      hasEntry,
      hash: '',
      pkg: sourcePkg,
      target,
    } as const;
  }

  const content = await checkSelfReportedDist(dist.absolute);
  const pkg = sourcePkg;
  const hash = content.digest;

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
  if (!Fs.Path.Is.within(root, path)) {
    throw new Error(`DenoEntry.serve: '${label}' escapes root '${root}': ${rel}`);
  }
  return path;
}

function ensureDotRelativeDir(dir: t.StringDir): t.StringRelativeDir {
  return dir.startsWith('./') ? dir : `./${dir}`;
}
