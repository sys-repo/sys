import { type t, Fs, Is, Pkg } from './common.ts';

export async function writeDistFiles(dirs: Iterable<t.StringDir>): Promise<number> {
  const unique = new Set<string>();
  for (const dir of dirs) {
    const value = String(dir ?? '').trim();
    if (value) unique.add(value);
  }

  let written = 0;
  for (const dir of unique) {
    if (!(await Fs.exists(dir))) continue;
    if (!(await Fs.Is.dir(dir))) continue;
    await Pkg.Dist.compute({ dir, save: true });
    written += 1;
  }
  return written;
}

export const collectDistDirs = {
  fromMediaSeq: collectDistDirsFromMediaSeq,
  fromSlugTreeFs: collectDistDirsFromSlugTreeFs,
} as const;

function collectDistDirsFromMediaSeq(bundle: t.SlugBundleMediaSeq): readonly t.StringDir[] {
  const target = bundle.target;
  const manifestsBase = target?.manifests?.base ?? Fs.join(Fs.cwd('terminal'), 'publish.assets');
  const manifestsDir = target?.manifests?.dir ?? 'manifests';
  const videoBase = target?.media?.video?.base ?? manifestsBase;
  const imageBase = target?.media?.image?.base ?? manifestsBase;
  const videoDir = target?.media?.video?.dir ?? 'video';
  const imageDir = target?.media?.image?.dir ?? 'image';

  const dirs = new Set<string>();
  addDir(dirs, manifestsBase);
  addDir(dirs, resolveDir(manifestsBase, manifestsDir));
  addDir(dirs, resolveDir(videoBase, videoDir));
  if (bundle.target?.media?.image !== undefined) {
    addDir(dirs, resolveDir(imageBase, imageDir));
  }
  return [...dirs] as t.StringDir[];
}

function collectDistDirsFromSlugTreeFs(args: {
  cwd: t.StringDir;
  config: t.SlugBundleFileTree;
}): readonly t.StringDir[] {
  const manifestTargets = normalizeTargets(args.config.target?.manifests);
  const targetDirs = normalizeTargetDirs(args.config.target?.dir);
  if (manifestTargets.length === 0 && targetDirs.length === 0) return [];

  const dirs = new Set<string>();
  for (const targetDir of targetDirs) {
    const resolved = resolveDirPath(args.cwd, String(targetDir.path ?? ''));
    addDir(dirs, resolved);
  }
  for (const target of manifestTargets) {
    const resolved = resolveDirPath(args.cwd, String(target));
    addDir(dirs, Fs.dirname(resolved));
  }

  const root = commonAncestor([...dirs]);
  if (root && shouldIncludeRoot(root)) addDir(dirs, root);

  return [...dirs] as t.StringDir[];
}

function normalizeTargets(input?: t.StringPath | readonly t.StringPath[]): t.StringPath[] {
  if (!input) return [];
  const list = Is.array(input) ? input : [input];
  return list.map((value) => String(value).trim()).filter(Boolean) as t.StringPath[];
}

function normalizeTargetDirs(
  input?: t.StringPath | t.SlugBundleFileTreeTargetDir | readonly t.SlugBundleFileTreeTargetDir[],
): t.SlugBundleFileTreeTargetDir[] {
  if (!input) return [];
  if (Is.str(input)) return [{ kind: 'source', path: input }];
  if (Is.array(input)) return input.filter(Boolean) as t.SlugBundleFileTreeTargetDir[];
  return [input as t.SlugBundleFileTreeTargetDir];
}

function resolveDirPath(cwd: t.StringDir, path: t.StringPath): t.StringDir {
  return Fs.Path.resolve(cwd, Fs.Tilde.expand(String(path))) as t.StringDir;
}

function resolveDir(baseDir: t.StringDir, subPath: t.StringDir): t.StringDir {
  if (Fs.Path.Is.absolute(subPath)) return subPath;
  return Fs.join(baseDir, subPath);
}

function addDir(dirs: Set<string>, dir: string): void {
  const value = String(dir ?? '').trim();
  if (!value) return;
  dirs.add(value);
}

function commonAncestor(dirs: readonly t.StringDir[]): t.StringDir | undefined {
  if (dirs.length === 0) return;
  let candidate = Fs.Path.resolve(String(dirs[0]));
  for (const dir of dirs.slice(1)) {
    const resolved = Fs.Path.resolve(String(dir));
    while (candidate && !isAncestor(candidate, resolved)) {
      const next = Fs.Path.dirname(candidate);
      if (next === candidate) return;
      candidate = next;
    }
  }
  return candidate as t.StringDir;
}

function isAncestor(parent: string, child: string): boolean {
  const rel = Fs.Path.relative(parent, child);
  if (!rel || rel === '.') return true;
  const normalized = rel.replaceAll('\\', '/');
  if (normalized.startsWith('../')) return false;
  if (normalized === '..') return false;
  return !Fs.Path.Is.absolute(rel);
}

function shouldIncludeRoot(root: string): boolean {
  if (!root) return false;
  if (Fs.Path.dirname(root) === root) return false;
  return true;
}
