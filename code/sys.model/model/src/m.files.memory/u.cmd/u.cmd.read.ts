import { D, type t } from '../common.ts';
import { effectiveMaxReadBytes } from '../u/u.read-limit.ts';
import { assertPayload } from './u.cmd.payload.ts';
import { fail } from '../u/u.error.ts';
import { type MemoryNodes } from '../u/u.index.ts';
import { entryFromNode } from '../u/u.node.ts';
import { absolutePath, requiredVisiblePath } from '../u/u.path.ts';
import { allowed } from '../u/u.policy.ts';

/** Implementation of the `files:read` command for memory nodes. */
export const read = (
  nodes: MemoryNodes,
  policy: t.Files.Policy.Shape,
  payload: t.Files.Cmd.Read.Payload,
  maxReadBytes: t.NumberBytes | undefined,
): t.Files.Cmd.Read.Result => {
  assertPayload(payload, 'read');
  const path = requiredVisiblePath(payload.path);
  if (!allowed(policy, 'read', path)) {
    throw fail('FilesMemoryError.PolicyDenied', `Read denied: ${path}`);
  }

  const encoding: string = payload.encoding ?? D.encoding;
  if (encoding !== D.encoding) {
    throw fail('FilesMemoryError.Unsupported', 'Unsupported Files read encoding');
  }
  const limit = effectiveMaxReadBytes(payload.maxBytes, maxReadBytes);

  const node = nodes.get(absolutePath(path));
  if (!node) throw fail('FilesMemoryError.NotFound', `File not found: ${path}`);
  if (node.kind !== 'file') throw fail('FilesMemoryError.NotFile', `Not a file: ${path}`);
  if (node.body === 'bytes') {
    throw fail('FilesMemoryError.Unsupported', `Binary inline read unsupported: ${path}`);
  }
  if (limit !== undefined && node.size > limit) {
    throw fail('FilesMemoryError.ReadTooLarge', `Read exceeds max bytes: ${path}`);
  }
  const entry = entryFromNode(path, node);
  if (entry.kind !== 'file') throw fail('FilesMemoryError.NotFile', `Not a file: ${path}`);

  return {
    kind: 'inline',
    file: entry,
    encoding,
    content: node.content,
  };
};
