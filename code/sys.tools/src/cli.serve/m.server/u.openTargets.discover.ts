import { Fs, Path, Pkg, Str, type t } from '../common.ts';

export type OpenTargetEntry = {
  readonly path: string;
  readonly fileCount: number;
  readonly hash?: t.StringHash;
};

export async function discoverOpenTargets(dir: t.StringDir): Promise<readonly OpenTargetEntry[]> {
  const entries = await Fs.glob(dir, { includeDirs: true }).find('**/*');
  const fileRels = entries
    .filter((entry) => entry.isFile)
    .map((entry) => Path.relative(dir, entry.path).replaceAll('\\', '/'));
  const fileRelSet = new Set(fileRels);
  const countsByDir = countFilesByDir(fileRels);
  const all: OpenTargetEntry[] = [
    { path: '', fileCount: countsByDir.get('') ?? 0 },
  ];

  for (const entry of entries) {
    if (!entry.isDirectory) continue;
    const rel = Path.relative(dir, entry.path).replaceAll('\\', '/');
    if (!rel || rel === '.') continue;

    const hasIndex = fileRelSet.has(`${rel}/index.html`);
    const hasDist = fileRelSet.has(`${rel}/dist.json`);
    if (!hasIndex || !hasDist) continue;

    const loaded = await Pkg.Dist.load(entry.path);
    if (!Pkg.Is.dist(loaded.dist)) continue;

    all.push({
      path: rel,
      fileCount: countsByDir.get(rel) ?? 0,
      hash: loaded.dist.hash.digest,
    });
  }

  const [root, ...rest] = all;
  return [root, ...filterTopmost(rest)];
}

/**
 * Helpers:
 */
function countFilesByDir(relFilePaths: readonly string[]): Map<string, number> {
  const counts = new Map<string, number>();

  for (const relFilePath of relFilePaths) {
    let cursor = Path.dirname(relFilePath).replaceAll('\\', '/');
    while (true) {
      const key = cursor === '.' ? '' : cursor;
      counts.set(key, (counts.get(key) ?? 0) + 1);
      if (key === '') break;
      cursor = Path.dirname(key).replaceAll('\\', '/');
    }
  }

  return counts;
}

function filterTopmost(entries: readonly OpenTargetEntry[]): OpenTargetEntry[] {
  const compare = Str.Compare.natural();
  const ordered = [...entries].sort((a, b) => {
    const d = pathDepth(a.path) - pathDepth(b.path);
    return d !== 0 ? d : compare(a.path, b.path);
  });

  const keep: OpenTargetEntry[] = [];
  for (const entry of ordered) {
    const covered = keep.some((picked) => isAncestorPath(picked.path, entry.path));
    if (!covered) keep.push(entry);
  }

  return keep;
}

function isAncestorPath(parent: string, child: string): boolean {
  if (!parent || parent === child) return false;
  return child.startsWith(`${parent}/`);
}

function pathDepth(path: string): number {
  return Str.trimSlashes(path).split('/').filter(Boolean).length;
}
