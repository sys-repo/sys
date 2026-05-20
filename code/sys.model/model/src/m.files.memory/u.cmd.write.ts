import { Is, type t } from './common.ts';
import { fail } from './u.error.ts';
import { type MemoryNodes, putWriteFile } from './u.index.ts';
import { writeFileNode } from './u.node.write.ts';
import { entryFromNode } from './u.node.ts';
import { visiblePath } from './u.path.ts';
import { allowed } from './u.policy.ts';

/** Implementation of the `files:write` command for mutable memory nodes. */
export const write = (
  nodes: MemoryNodes,
  policy: t.FilesPolicy.Shape,
  payload: t.FilesCmd.Write.Payload,
): t.FilesCmd.Write.Result => {
  if (!Is.plainObject(payload)) {
    throw fail('FilesMemoryError.InvalidPath', 'Files write payload must be a plain object');
  }

  const path = visiblePath(payload.path);
  const node = writeFileNode(payload);

  if (!allowed(policy, 'write', path)) {
    throw fail('FilesMemoryError.PolicyDenied', `Write denied: ${path}`);
  }

  const { previous } = putWriteFile(nodes, path, node);
  const kind = previous?.kind === 'file' ? 'modified' : 'created';
  const entry = allowed(policy, 'stat', path) ? entryFromNode(path, node) : undefined;

  return {
    kind,
    path,
    ...(entry?.kind === 'file' ? { entry } : {}),
  };
};
