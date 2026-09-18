import { allowed } from '../../m.files/u/u.policy.ts';
import { D, type t } from '../common.ts';
import { fail } from '../u/u.error.ts';
import type { StaticIndex } from '../u/u.index.ts';
import { requiredVisiblePath } from '../u/u.path.ts';

/** Implementation of the `files:read` command for static dist metadata. */
export const read = (
  index: StaticIndex,
  policy: t.Files.Policy.Shape,
  payload: t.Files.Cmd.Read.Payload,
): t.Files.Cmd.Read.Result => {
  const path = requiredVisiblePath(payload.path);
  if (!allowed(policy, 'read', path)) {
    throw fail('FilesStaticError.PolicyDenied', `Read denied: ${path}`);
  }

  const encoding: string = payload.encoding ?? D.encoding;
  if (encoding !== D.encoding) {
    throw fail('FilesStaticError.Unsupported', 'Unsupported Files read encoding');
  }

  const entry = index.entriesByPath.get(path);
  if (!entry) throw fail('FilesStaticError.NotFound', `File not found: ${path}`);
  if (entry.kind !== 'file') throw fail('FilesStaticError.NotFile', `Not a file: ${path}`);

  const file = index.filesByPath.get(path);
  if (!file) throw fail('FilesStaticError.NotFound', `File not found: ${path}`);
  return { kind: 'ref', file: file.entry, contentRef: file.contentRef };
};
