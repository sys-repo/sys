import { type t } from '../common.ts';
import { assertPayload } from './u.cmd.payload.ts';
import { fail } from '../u/u.error.ts';
import { type MemoryNodes } from '../u/u.index.ts';
import { entryFromNode } from '../u/u.node.ts';
import { absolutePath, requiredVisiblePath } from '../u/u.path.ts';
import { allowed } from '../u/u.policy.ts';

/** Implementation of the `files:stat` command for memory nodes. */
export const stat = (
  nodes: MemoryNodes,
  policy: t.Files.Policy.Shape,
  payload: t.Files.Cmd.Stat.Payload,
): t.Files.Cmd.Stat.Result => {
  assertPayload(payload, 'stat');
  const path = requiredVisiblePath(payload.path);
  if (!allowed(policy, 'stat', path)) {
    throw fail('FilesMemoryError.PolicyDenied', `Stat denied: ${path}`);
  }

  const node = nodes.get(absolutePath(path));
  if (!node) throw fail('FilesMemoryError.NotFound', `Path not found: ${path}`);
  return { entry: entryFromNode(path, node) };
};
