import { type t } from './common.ts';
import { assertPayload } from './u.cmd.payload.ts';
import { fail } from './u.error.ts';
import { type MemoryNodes } from './u.index.ts';
import { entryFromNode } from './u.node.ts';
import { absolutePath, requiredVisiblePath } from './u.path.ts';
import { allowed } from './u.policy.ts';

/** Implementation of the `files:stat` command for memory nodes. */
export const stat = (
  nodes: MemoryNodes,
  policy: t.FilesPolicy.Shape,
  payload: t.FilesCmd.Stat.Payload,
): t.FilesCmd.Stat.Result => {
  assertPayload(payload, 'stat');
  const path = requiredVisiblePath(payload.path);
  if (!allowed(policy, 'stat', path)) {
    throw fail('FilesMemoryError.PolicyDenied', `Stat denied: ${path}`);
  }

  const node = nodes.get(absolutePath(path));
  if (!node) throw fail('FilesMemoryError.NotFound', `Path not found: ${path}`);
  return { entry: entryFromNode(path, node) };
};
