import { type t } from '../common.ts';
import { json } from '../-bundle/-bundle.ts';
import type { CellTmpl } from '../t.ts';
import { CellPaths } from '../../m.cell/u.paths.ts';
import { ROOTS } from './u.roots.ts';

export function listTmplPaths(name: CellTmpl.Name): readonly t.StringPath[] {
  const root = ROOTS[name];
  return Object.keys(json)
    .filter((path) => path.startsWith(`${root}/`))
    .map((path) => path.slice(root.length + 1))
    .sort();
}

export function tmplDescriptorPath(name: CellTmpl.Name): t.StringPath {
  return requireTmplPath(name, CellPaths.legacy.descriptor);
}

export function listTmplOwnedPaths(name: CellTmpl.Name): readonly t.StringPath[] {
  return [tmplDescriptorPath(name)];
}

/**
 * Helpers:
 */
function requireTmplPath(name: CellTmpl.Name, path: t.StringPath): t.StringPath {
  if (listTmplPaths(name).includes(path)) return path;
  throw new Error(`Cell template ${name} is missing expected resource: ${path}`);
}
