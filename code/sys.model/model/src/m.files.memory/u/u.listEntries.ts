import { Glob, type t } from '../common.ts';
import {
  type ListEntriesOptions,
  snapshotListOptions,
  withinDepth,
  withinScope,
} from '../../m.files/u/u.list.ts';
import { fail } from './u.error.ts';
import { type MemoryNodes } from './u.index.ts';
import { entryFromNode } from './u.node.ts';
import { absolutePath, invalidPath, relativePath, visibleFromAbsolute } from './u.path.ts';
import { allowed } from './u.policy.ts';

/** Traverse memory nodes and return visible list entries. */
export const listEntries = (
  nodes: MemoryNodes,
  policy: t.Files.Policy.Shape,
  options: ListEntriesOptions,
): readonly t.Files.Entry[] => {
  const query = snapshotListOptions(options, invalidPath);
  if (!allowed(policy, 'list', query.path)) {
    throw fail('FilesMemoryError.PolicyDenied', `List denied: ${query.path}`);
  }

  const root = nodes.get(absolutePath(query.path));
  if (!root) throw fail('FilesMemoryError.NotFound', `Directory not found: ${query.path}`);
  if (root.kind !== 'dir') {
    throw fail('FilesMemoryError.NotDirectory', `Not a directory: ${query.path}`);
  }

  const entries: t.Files.Entry[] = [];
  for (const [absolute, node] of nodes.entries()) {
    const path = visibleFromAbsolute(absolute);
    if (path === query.path) continue;
    if (!withinScope(path, query.path, relativePath)) continue;
    if (!withinDepth(path, query.path, query.depth, relativePath)) continue;
    if (!allowed(policy, 'list', path)) continue;
    if (query.match && !Glob.matches(query.match, path)) continue;
    if (query.exclude && Glob.matches(query.exclude, path)) continue;
    entries.push(entryFromNode(path, node));
  }

  return entries.sort((a, b) => a.path.localeCompare(b.path));
};
