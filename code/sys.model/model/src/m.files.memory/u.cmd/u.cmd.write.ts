import { Is, type t } from '../common.ts';
import { fail } from '../u/u.error.ts';
import { type MemoryNodes, putWriteFile } from '../u/u.index.ts';
import { writeFileNode } from '../u/u.node.write.ts';
import { entryFromNode } from '../u/u.node.ts';
import { visiblePath } from '../u/u.path.ts';
import { allowed } from '../u/u.policy.ts';

/** Implementation of the `files:write` command for mutable memory nodes. */
export const write = (
  nodes: MemoryNodes,
  policy: t.Files.Policy.Shape,
  payload: t.Files.Cmd.Write.Payload,
  maxWriteBytes?: t.NumberBytes,
): t.Files.Cmd.Write.Result => {
  if (!Is.plainObject(payload)) {
    throw fail('FilesMemoryError.InvalidPath', 'Files write payload must be a plain object');
  }

  const path = visiblePath(payload.path);
  if (!allowed(policy, 'write', path)) {
    throw fail('FilesMemoryError.PolicyDenied', `Write denied: ${path}`);
  }

  const node = writeFileNode(payload, {
    path,
    ...(maxWriteBytes === undefined ? {} : { maxWriteBytes }),
  });

  const { previous } = putWriteFile(nodes, path, node);
  const kind = previous?.kind === 'file' ? 'modified' : 'created';
  const entry = allowed(policy, 'stat', path) ? entryFromNode(path, node) : undefined;

  return {
    kind,
    path,
    ...(entry?.kind === 'file' ? { entry } : {}),
  };
};
