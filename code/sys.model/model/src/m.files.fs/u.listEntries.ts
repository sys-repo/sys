import { Glob, type t } from './common.ts';
import { entryFromStat, statFromWalkEntry } from './u.entry.ts';
import { fail } from './u.error.ts';
import { allowed } from './u.policy.ts';
import { absolutePath, assertRealInside, relativePath, type Scope } from './u.path.ts';

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
  if (!allowed(policy, 'list', options.path)) {
    throw fail('FilesFsError.PolicyDenied', `List denied: ${options.path}`);
  }

  const absolute = absolutePath(scope, options.path);
  const real = await assertRealInside(scope, absolute);
  if (!real) throw fail('FilesFsError.NotFound', `Directory not found: ${options.path}`);

  const rootInfo = await scope.fs.stat(real);
  if (!rootInfo) throw fail('FilesFsError.NotFound', `Directory not found: ${options.path}`);
  const rootEntry = entryFromStat(options.path, rootInfo);
  if (rootEntry.kind !== 'dir') {
    throw fail('FilesFsError.NotDirectory', `Not a directory: ${options.path}`);
  }

  const entries: t.Files.Entry[] = [];
  const walked = await scope.fs.walk(real);

  for await (const item of walked) {
    const absoluteEntry = scope.fs.path.Is.absolute(item.path)
      ? item.path
      : scope.fs.path.resolve(real, item.path);
    const realEntry = await assertRealInside(scope, absoluteEntry);
    if (!realEntry) continue;

    const path = relativePath(scope, absoluteEntry);
    if (path === '') continue;
    if (!withinScope(scope, path, options.path)) continue;
    if (!withinDepth(scope, path, options.path, options.depth)) continue;
    if (!allowed(policy, 'list', path)) continue;
    if (options.match && !Glob.matches(options.match, path)) continue;
    if (options.exclude && Glob.matches(options.exclude, path)) continue;

    const info = item.stat ?? statFromWalkEntry(item);
    entries.push(entryFromStat(path, info));
  }

  return entries.sort((a, b) => a.path.localeCompare(b.path));
};

/**
 * Helpers:
 */

const withinScope = (
  scope: Scope,
  path: t.Files.StringPath,
  base: t.Files.StringPath,
): boolean => {
  if (base === '') return true;
  const relative = scope.fs.path.relative(base, path).replaceAll('\\', '/');
  return relative === '' || (!relative.startsWith('../') && relative !== '..');
};

const withinDepth = (
  scope: Scope,
  path: t.Files.StringPath,
  base: t.Files.StringPath,
  depth?: t.Files.Depth,
): boolean => {
  if (depth === undefined) return true;
  const relative = base === '' ? path : scope.fs.path.relative(base, path).replaceAll('\\', '/');
  if (relative === '') return true;
  return relative.split('/').filter(Boolean).length <= depth;
};
