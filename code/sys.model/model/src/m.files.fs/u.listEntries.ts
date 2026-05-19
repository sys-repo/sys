import { Glob, Num, type t } from './common.ts';
import { entryFromStat, statFromWalkEntry } from './u.entry.ts';
import { fail } from './u.error.ts';
import { snapshotOptionalMatch } from './u.match.ts';
import { allowed } from './u.policy.ts';
import {
  absolutePath,
  assertInsideRealScope,
  realScope,
  relativePath,
  type Scope,
} from './u.path.ts';

export type ListEntriesOptions = {
  readonly path: t.Files.StringPath;
  readonly depth?: t.Files.Depth;
  readonly match?: t.Files.Match;
  readonly exclude?: t.Files.Match;
};

/**
 * Traverse a bounded files/fs scope and return visible list entries.
 */
export const listEntries = async (
  scope: Scope,
  policy: t.Files.Policy.Shape,
  options: ListEntriesOptions,
): Promise<readonly t.Files.Entry[]> => {
  const query = snapshotListOptions(options);
  if (!allowed(policy, 'list', query.path)) {
    throw fail('FilesFsError.PolicyDenied', `List denied: ${query.path}`);
  }

  const absolute = absolutePath(scope, query.path);
  const canonicalScope = await realScope(scope);
  const real = await assertInsideRealScope(canonicalScope, absolute);
  if (!real) throw fail('FilesFsError.NotFound', `Directory not found: ${query.path}`);

  const rootInfo = await scope.fs.stat(real);
  if (!rootInfo) throw fail('FilesFsError.NotFound', `Directory not found: ${query.path}`);
  const rootEntry = entryFromStat(query.path, rootInfo);
  if (rootEntry.kind !== 'dir') {
    throw fail('FilesFsError.NotDirectory', `Not a directory: ${query.path}`);
  }

  const entries: t.Files.Entry[] = [];
  const walked = await scope.fs.walk(real);

  for await (const item of walked) {
    const absoluteEntry = scope.fs.Path.Is.absolute(item.path)
      ? item.path
      : scope.fs.Path.resolve(real, item.path);
    const realEntry = await assertInsideRealScope(canonicalScope, absoluteEntry);
    if (!realEntry) continue;

    const path = relativePath(canonicalScope, absoluteEntry);
    if (path === '') continue;
    if (!withinScope(scope, path, query.path)) continue;
    if (!withinDepth(scope, path, query.path, query.depth)) continue;
    if (!allowed(policy, 'list', path)) continue;
    if (query.match && !Glob.matches(query.match, path)) continue;
    if (query.exclude && Glob.matches(query.exclude, path)) continue;

    const info = item.stat ?? statFromWalkEntry(item);
    entries.push(entryFromStat(path, info));
  }

  return entries.sort((a, b) => a.path.localeCompare(b.path));
};

/**
 * Helpers:
 */

const snapshotListOptions = (options: ListEntriesOptions): ListEntriesOptions => {
  if (options.depth !== undefined && (!Num.Is.safeInt(options.depth) || options.depth < 0)) {
    throw fail('FilesFsError.InvalidPath', 'Invalid Files depth');
  }
  return Object.freeze({
    path: options.path,
    ...(options.depth === undefined ? {} : { depth: options.depth }),
    ...(options.match === undefined
      ? {}
      : { match: snapshotOptionalMatch(options.match, 'Invalid Files match') }),
    ...(options.exclude === undefined
      ? {}
      : { exclude: snapshotOptionalMatch(options.exclude, 'Invalid Files exclude') }),
  });
};

const withinScope = (
  scope: Scope,
  path: t.Files.StringPath,
  base: t.Files.StringPath,
): boolean => {
  if (base === '') return true;
  const relative = scope.fs.Path.relative(base, path).replaceAll('\\', '/');
  return relative === '' || (!relative.startsWith('../') && relative !== '..');
};

const withinDepth = (
  scope: Scope,
  path: t.Files.StringPath,
  base: t.Files.StringPath,
  depth?: t.Files.Depth,
): boolean => {
  if (depth === undefined) return true;
  const relative = base === '' ? path : scope.fs.Path.relative(base, path).replaceAll('\\', '/');
  if (relative === '') return true;
  return relative.split('/').filter(Boolean).length <= depth;
};
