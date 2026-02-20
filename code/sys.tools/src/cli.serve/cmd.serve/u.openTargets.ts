import { type t, c, Cli, Fs, Path, Pkg, Str } from '../common.ts';
import { Fmt } from '../u.fmt.ts';

type Entry = {
  readonly name: string;
  readonly path: string;
  readonly fileCount: number;
};

export type OpenMenuPick = { cmd: 'open'; path: string };
export type YamlLocation = t.ServeTool.LocationYaml.Location;

export const OpenTargets = {
  async menuOptions(location: YamlLocation): Promise<readonly OpenMenuOption[]> {
    const roots = await OpenTargets.discover(location.dir);
    const withTreeBranches = (
      items: readonly Entry[],
      depth = 1,
    ): ReadonlyArray<{ name: string; value: OpenMenuPick }> => {
      const rows = items.map((item, index) => {
        const tree = Fmt.Tree.branch([index, items], depth);
        const base = `${tree} ${String(item.name).trimStart()}`.trimEnd();
        const files = `${item.fileCount}-${Str.plural(item.fileCount, 'file')}`;
        const suffix = c.gray(c.dim(` | ${files}`));
        return { item, base, suffix };
      });

      const width = Math.max(0, ...rows.map((row) => Cli.stripAnsi(row.base).length));
      return rows.map((row) => {
        const len = Cli.stripAnsi(row.base).length;
        const pad = ' '.repeat(Math.max(0, width - len));
        const name = ` ${row.base}${pad}${row.suffix}`.trimEnd();
        return {
          name,
          value: { cmd: 'open', path: row.item.path },
        };
      });
    };
    return withTreeBranches(roots, 1);
  },

  async discover(dir: t.StringDir): Promise<readonly Entry[]> {
    const entries = await Fs.glob(dir, { includeDirs: true }).find('**/*');
    const fileRels = entries
      .filter((entry) => entry.isFile)
      .map((entry) => Path.relative(dir, entry.path).replaceAll('\\', '/'));
    const fileRelSet = new Set(fileRels);
    const countsByDir = countFilesByDir(fileRels);
    const all: Entry[] = [
      { name: `${c.dim('root')}   /`, path: '', fileCount: countsByDir.get('') ?? 0 },
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

      const hx = loaded.dist.hash.digest;
      const hxshort = c.green(hx.slice(-5));
      const label = `${c.gray(c.dim(`#${hxshort} `))}${rel}`;
      const fileCount = countsByDir.get(rel) ?? 0;
      all.push({ name: label, path: rel, fileCount });
    }

    const [root, ...rest] = all;
    return [root, ...filterTopmost(rest)];
  },
} as const;

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

/**
 * Helpers:
 */
function filterTopmost(entries: Entry[]): Entry[] {
  const compare = Str.Compare.natural();
  const ordered = [...entries].sort((a, b) => {
    const d = pathDepth(a.path) - pathDepth(b.path);
    return d !== 0 ? d : compare(a.path, b.path);
  });

  const keep: Entry[] = [];
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
