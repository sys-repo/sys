import { Glob, type t } from './common.ts';
import {
  type ListEntriesOptions,
  snapshotListOptions,
  withinDepth,
  withinScope,
} from '../m.files/u.list.ts';
import { entryFromStat, statFromWalkEntry } from './u.entry.ts';
import { fail } from './u.error.ts';
import { allowed } from './u.policy.ts';
import {
  absolutePath,
  assertInsideRealScope,
  realScope,
  relativePath,
  type Scope,
} from './u.path.ts';

const invalidPath = (message: string): Error => fail('FilesFsError.InvalidPath', message);

/**
 * Traverse a bounded files/fs scope and return visible list entries.
 */
export const listEntries = async (
  scope: Scope,
  policy: t.Files.Policy.Shape,
  options: ListEntriesOptions,
): Promise<readonly t.Files.Entry[]> => {
  const query = snapshotListOptions(options, invalidPath);
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
    if (!withinScope(path, query.path, scope.fs.Path.relative)) continue;
    if (!withinDepth(path, query.path, query.depth, scope.fs.Path.relative)) continue;
    if (!allowed(policy, 'list', path)) continue;
    if (query.match && !Glob.matches(query.match, path)) continue;
    if (query.exclude && Glob.matches(query.exclude, path)) continue;

    const info = item.stat ?? statFromWalkEntry(item);
    entries.push(entryFromStat(path, info));
  }

  return entries.sort((a, b) => a.path.localeCompare(b.path));
};
