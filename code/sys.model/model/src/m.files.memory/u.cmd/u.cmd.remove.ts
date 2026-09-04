import { Is, type t } from '../common.ts';
import { fail } from '../u/u.error.ts';
import { type MemoryNodes } from '../u/u.index.ts';
import { absolutePath, visibleFromAbsolute, visiblePath } from '../u/u.path.ts';
import { allowed } from '../u/u.policy.ts';

type RemovedEntry = {
  readonly absolute: t.StringAbsolutePath;
  readonly path: t.Files.String.Path;
};

export type RemoveMutation = {
  readonly result: t.Files.Cmd.Remove.Result;
  readonly deleted: readonly t.Files.String.Path[];
};

/** Implementation of the `files:remove` command for mutable memory nodes. */
export const remove = (
  nodes: MemoryNodes,
  policy: t.Files.Policy.Shape,
  payload: t.Files.Cmd.Remove.Payload,
): RemoveMutation => {
  if (!Is.plainObject(payload)) {
    throw fail('FilesMemoryError.InvalidPath', 'Files remove payload must be a plain object');
  }
  if (payload.recursive !== undefined && !Is.bool(payload.recursive)) {
    throw fail('FilesMemoryError.InvalidPath', 'Files remove recursive flag must be boolean');
  }

  const path = visiblePath(payload.path);
  if (path === '') throw fail('FilesMemoryError.InvalidPath', 'Cannot remove memory root');
  if (!allowed(policy, 'remove', path)) {
    throw fail('FilesMemoryError.PolicyDenied', `Remove denied: ${path}`);
  }

  const absolute = absolutePath(path);
  const node = nodes.get(absolute);
  if (!node) throw fail('FilesMemoryError.NotFound', `Path not found: ${path}`);

  const entries = removedEntries(nodes, absolute);
  if (node.kind === 'dir' && payload.recursive !== true && entries.length > 1) {
    throw fail('FilesMemoryError.DirectoryNotEmpty', `Directory not empty: ${path}`);
  }

  for (const entry of entries) {
    if (!allowed(policy, 'remove', entry.path)) {
      throw fail('FilesMemoryError.PolicyDenied', `Remove denied: ${entry.path}`);
    }
  }

  for (const entry of entries) nodes.delete(entry.absolute);

  return {
    result: { kind: 'deleted', path },
    deleted: entries.map((entry) => entry.path),
  };
};

function removedEntries(
  nodes: MemoryNodes,
  absolute: t.StringAbsolutePath,
): readonly RemovedEntry[] {
  const prefix = `${absolute}/`;
  return [...nodes.keys()]
    .filter((entry) => entry === absolute || entry.startsWith(prefix))
    .sort((a, b) => b.length - a.length || a.localeCompare(b))
    .map((entry) => ({ absolute: entry, path: visibleFromAbsolute(entry) }));
}
