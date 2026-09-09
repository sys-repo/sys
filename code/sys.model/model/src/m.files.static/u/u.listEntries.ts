import { Glob, type t } from '../common.ts';
import {
  type ListEntriesOptions,
  snapshotListOptions,
  withinDepth,
  withinScope,
} from '../../m.files/u/u.list.ts';
import { allowed } from '../../m.files/u/u.policy.ts';
import { fail, invalidPath } from './u.error.ts';
import type { StaticIndex } from './u.index.ts';
import { relativePath } from './u.path.ts';

/** Traverse a static dist index and return visible list entries. */
export const listEntries = (
  index: StaticIndex,
  policy: t.Files.Policy.Shape,
  options: ListEntriesOptions,
): readonly t.Files.Entry[] => {
  const query = snapshotListOptions(options, invalidPath);
  if (!allowed(policy, 'list', query.path)) {
    throw fail('FilesStaticError.PolicyDenied', `List denied: ${query.path}`);
  }

  if (query.path !== '') {
    const root = index.entriesByPath.get(query.path);
    if (!root) throw fail('FilesStaticError.NotFound', `Directory not found: ${query.path}`);
    if (root.kind !== 'dir') {
      throw fail('FilesStaticError.NotDirectory', `Not a directory: ${query.path}`);
    }
  }

  const entries: t.Files.Entry[] = [];
  for (const entry of index.entries) {
    if (entry.path === query.path) continue;
    if (!withinScope(entry.path, query.path, relativePath)) continue;
    if (!withinDepth(entry.path, query.path, query.depth, relativePath)) continue;
    if (!allowed(policy, 'list', entry.path)) continue;
    if (query.match && !Glob.matches(query.match, entry.path)) continue;
    if (query.exclude && Glob.matches(query.exclude, entry.path)) continue;
    entries.push(entry);
  }

  return entries.sort((a, b) => a.path.localeCompare(b.path));
};
