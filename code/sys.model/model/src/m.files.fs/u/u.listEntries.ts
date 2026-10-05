import { Glob, type t } from '../common.ts';
import {
  type ListEntriesOptions,
  snapshotListOptions,
  withinDepth,
  withinScope,
} from '../../m.files/u/u.list.ts';
import { realDirectory } from './u.dir.ts';
import { entryFromStat, statFromWalkEntry } from './u.entry.ts';
import { fail } from './u.error.ts';
import { allowed } from './u.policy.ts';
import { assertInsideRealScope, relativePath, type Scope } from './u.path.ts';

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

  const root = await realDirectory(scope, query.path);
  const entries: t.Files.Entry[] = [];
  const walked = await scope.fs.walk(root.real);

  for await (const item of walked) {
    const absoluteEntry = scope.fs.Path.Is.absolute(item.path)
      ? item.path
      : scope.fs.Path.resolve(root.real, item.path);
    const realEntry = await assertInsideRealScope(root.scope, absoluteEntry);
    if (!realEntry) continue;

    const path = relativePath(root.scope, absoluteEntry);
    if (path === '') continue;
    if (!withinScope(path, query.path, scope.fs.Path.relative)) continue;
    if (!withinDepth(path, query.path, query.depth, scope.fs.Path.relative)) continue;
    if (!allowed(policy, 'list', path)) continue;
    if (query.match && !Glob.matches(query.match, path)) continue;
    if (query.exclude && Glob.matches(query.exclude, path)) continue;

    const info = item.stat ?? await scope.fs.stat(realEntry) ?? statFromWalkEntry(item);
    entries.push(entryFromStat(path, info));
  }

  return entries.sort((a, b) => a.path.localeCompare(b.path));
};
