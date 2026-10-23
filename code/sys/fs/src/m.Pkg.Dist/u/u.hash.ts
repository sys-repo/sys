import { DirHash } from '../../m.Dir.Hash/mod.ts';
import { Arr, D, Fs, Ignore, Obj, Path, type t } from '../common.ts';
import type { IgnorePolicy } from '../t.internal.ts';
import { load } from './u.load.ts';

type PartFilter = (path: t.StringPath) => boolean;
type HashOptions = Pick<t.Pkg.Dist.Compute.Args, 'filter' | 'trustChildDist' | 'onHashProgress'> & {
  ignore?: IgnorePolicy;
};
type ChildDist = {
  readonly rootRel: t.StringRelativeDir;
  readonly dist: t.DistPkg;
};

/** Collect selected parts directly, or combine fresh parent hashes with trusted child inventories. */
export async function hashes(path: t.StringDir, options: HashOptions = {}) {
  const { filter, trustChildDist = false, onHashProgress, ignore: policy } = options;
  if (!trustChildDist) return await hashesBase(path, filter, onHashProgress, policy);
  const children = await childDists(path);
  if (children.length === 0) return await hashesBase(path, filter, onHashProgress, policy);

  const childRoots = children.map((child) => Path.join(path, child.rootRel));
  const parentFilter = partFilter(path, filter, policy, childRoots);
  const res = await DirHash.compute(path, { filter: parentFilter, onProgress: onHashProgress });
  const include = partFilter(path, filter, policy);
  return { parts: mergeChildParts(path, res.hash.parts, children, include) };
}

export async function hashesBase(
  path: t.StringDir,
  filter?: (path: t.StringPath) => boolean,
  onHashProgress?: (e: t.Dir.Hash.Compute.ProgressEvent) => t.Awaitable<void>,
  policy?: IgnorePolicy,
) {
  const include = partFilter(path, filter, policy);
  const result = await DirHash.compute(path, { filter: include, onProgress: onHashProgress });
  return result.hash;
}

export function filepath(path: t.StringPath) {
  return path.endsWith('/dist.json') ? path : Fs.join(path, 'dist.json');
}

export async function ignore(input?: string | readonly string[]): Promise<IgnorePolicy> {
  const rules = Ignore.normalize([...D.hashPolicy.ignore.rules, ...(input ? [input].flat() : [])]);
  return { rules, digest: await Ignore.digest(rules), matcher: Ignore.create(rules) };
}

/**
 * Helpers:
 */

/** Keep selection order identical; cached child roots never reach the fresh-hash caller filter. */
function partFilter(
  root: t.StringDir,
  filter?: PartFilter,
  policy?: IgnorePolicy,
  childRoots: t.StringDir[] = [],
): PartFilter {
  return (path) => {
    if (!includeHashPart(path)) return false;
    if (policy && isIgnored(path, root, policy)) return false;
    if (childRoots.some((child) => Path.Is.within(child, path))) return false;
    return filter ? filter(path) : true;
  };
}

/** Rebase child inventory spellings without repairing them or resurrecting excluded files. */
function mergeChildParts(
  root: t.StringDir,
  base: t.CompositeHashParts,
  children: ChildDist[],
  include: PartFilter,
): t.CompositeHashParts {
  const parts = new Map(Object.entries(base));
  for (const child of children) {
    for (const [childPath, uri] of Object.entries(child.dist.hash.parts)) {
      const relative = `${child.rootRel}/${childPath}`;
      // Parent selection sees the same absolute path as direct collection.
      if (!include(Path.join(root, relative))) continue;
      if (parts.has(relative)) throw new Error('Dist child inventory collision.');
      parts.set(relative, uri);
    }
  }
  return Object.fromEntries(parts);
}

function includeHashPart(path: t.StringPath) {
  const name = Path.basename(path);
  return name !== 'dist.json' && name !== 'dist.json.sig';
}

function isIgnored(path: t.StringPath, root: t.StringDir, policy: IgnorePolicy) {
  return policy.matcher.isIgnored(path, Path.Is.absolute(path) ? root : undefined);
}

/** Admit only topmost child documents; their inventories already cover nested payloads. */
async function childDists(path: t.StringDir): Promise<ChildDist[]> {
  const entries = await Fs.glob(path, { includeDirs: false }).find('**/dist.json');
  const roots = entries
    .map((entry) => Path.dirname(Path.relative(path, entry.path)))
    .filter((rel) => rel !== '.' && rel !== '');
  const top = topmostRoots(roots);
  const children: ChildDist[] = [];
  for (const rootRel of top) {
    const loaded = await load(Path.join(path, rootRel));
    if (!loaded.dist || !Obj.hasOwn(loaded.dist.hash, 'scheme')) {
      throw new Error('Cannot reuse an unsupported child Dist.');
    }
    children.push({ rootRel, dist: loaded.dist });
  }
  return children;
}

/** Visit parents before descendants while retaining exact slash-delimited sibling boundaries. */
function topmostRoots(roots: t.StringRelativeDir[]): t.StringRelativeDir[] {
  const top: t.StringRelativeDir[] = [];
  for (const root of Arr.uniq(roots).sort((a, b) => a.length - b.length)) {
    if (!top.some((parent) => root === parent || root.startsWith(`${parent}/`))) top.push(root);
  }
  return top;
}
