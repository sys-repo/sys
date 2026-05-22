import { utf8ByteLength } from '../../m.files/u/u.bytes.ts';
import { D, type t } from '../common.ts';
import { effectiveMaxReadBytes } from '../u/u.read-limit.ts';
import { entryFromStat } from '../u/u.entry.ts';
import { fail } from '../u/u.error.ts';
import { allowed } from '../u/u.policy.ts';
import { absolutePath, assertRealInside, requiredVisiblePath, type Scope } from '../u/u.path.ts';

/**
 * Implementation of the `files:read` command.
 */
export const read = async (
  scope: Scope,
  policy: t.Files.Policy.Shape,
  payload: t.Files.Cmd.Read.Payload,
  maxReadBytes: t.NumberBytes | undefined,
): Promise<t.Files.Cmd.Read.Result> => {
  const path = requiredVisiblePath(scope.fs, payload.path);
  if (!allowed(policy, 'read', path)) {
    throw fail('FilesFsError.PolicyDenied', `Read denied: ${path}`);
  }

  const encoding: string = payload.encoding ?? D.encoding;
  if (encoding !== D.encoding) {
    throw fail('FilesFsError.Unsupported', 'Unsupported Files read encoding');
  }
  const limit = effectiveMaxReadBytes(payload.maxBytes, maxReadBytes);

  const absolute = absolutePath(scope, path);
  const real = await assertRealInside(scope, absolute);
  if (!real) throw fail('FilesFsError.NotFound', `File not found: ${path}`);

  const info = await scope.fs.stat(real);
  if (!info) throw fail('FilesFsError.NotFound', `File not found: ${path}`);
  const entry = entryFromStat(path, info);
  if (entry.kind !== 'file') throw fail('FilesFsError.NotFile', `Not a file: ${path}`);

  if (limit !== undefined && entry.size !== undefined && entry.size > limit) {
    throw fail('FilesFsError.ReadTooLarge', `Read exceeds max bytes: ${path}`);
  }

  const content = await scope.fs.readText(real);
  if (content === undefined) throw fail('FilesFsError.NotFound', `File not found: ${path}`);

  if (limit !== undefined && utf8ByteLength(content) > limit) {
    throw fail('FilesFsError.ReadTooLarge', `Read exceeds max bytes: ${path}`);
  }

  return { kind: 'inline', file: entry, encoding, content };
};
