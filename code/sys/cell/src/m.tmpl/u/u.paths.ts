import { type t } from '../common.ts';
import { json } from '../-bundle/-bundle.ts';
import type { CellTmpl } from '../t.ts';
import { GITIGNORE_PATH } from './u.gitignore.ts';
import { ROOTS } from './u.roots.ts';

const DescriptorPath = '-config/@sys.cell/cell.yaml' as t.StringPath;
const SharedPaths = [GITIGNORE_PATH] as const;

export function listTmplPaths(name: CellTmpl.Name): readonly t.StringPath[] {
  const root = ROOTS[name];
  return Object.keys(json)
    .filter((path) => path.startsWith(`${root}/`))
    .map((path) => path.slice(root.length + 1) as t.StringPath)
    .sort();
}

export function tmplDescriptorPath(name: CellTmpl.Name): t.StringPath {
  return requireTmplPath(name, DescriptorPath);
}

export function listTmplOwnedPaths(name: CellTmpl.Name): readonly t.StringPath[] {
  const shared = new Set<string>(SharedPaths);
  const owned = listTmplPaths(name)
    .filter((path) => !shared.has(path))
    .map(toOwnedPath);

  return [...unique(owned)].sort(compareOwnedPaths);
}

function requireTmplPath(name: CellTmpl.Name, path: t.StringPath): t.StringPath {
  if (listTmplPaths(name).includes(path)) return path;
  throw new Error(`Cell template ${name} is missing expected resource: ${path}`);
}

function toOwnedPath(path: t.StringPath): t.StringPath {
  if (path.startsWith('-config/')) return path;

  const [root, child] = path.split('/');
  if (root && child) return `${root}/` as t.StringPath;
  return path;
}

function unique(paths: readonly t.StringPath[]): readonly t.StringPath[] {
  return [...new Set(paths)];
}

function compareOwnedPaths(a: t.StringPath, b: t.StringPath): number {
  const rank = (path: t.StringPath) => {
    if (path.endsWith('/')) return 0;
    if (path.startsWith('-config/')) return 1;
    return 2;
  };

  return rank(a) - rank(b) || a.localeCompare(b);
}
