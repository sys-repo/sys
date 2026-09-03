import { Err, Is, ServerIs, Str, type t } from '../common.ts';

const NativeError = Error;
const defineProperties = Object.defineProperties;
const freeze = Object.freeze;
const FAILURES = new WeakSet<object>();

const MESSAGES: Readonly<Record<t.Fs.Snapshot.Failure.Kind, string>> = freeze({
  'invalid-options': 'Invalid filesystem snapshot options',
  'invalid-root': 'Invalid filesystem snapshot root',
  'invalid-path': 'Invalid filesystem snapshot path',
  'cancelled': 'Filesystem snapshot cancelled',
  'timeout': 'Filesystem snapshot timed out',
  'missing': 'Filesystem snapshot source is missing',
  'source-limit': 'Filesystem snapshot source byte limit exceeded',
  'unsafe-filesystem': 'Unsafe filesystem state observed while snapshotting',
  'source-changed': 'Filesystem snapshot source changed during observation',
  'permission-denied': 'Filesystem snapshot permission denied',
  'io-failure': 'Filesystem snapshot IO failed',
});

/** Create one frozen owner-authenticated snapshot failure. */
export function failure(
  kind: t.Fs.Snapshot.Failure.Kind,
): t.Fs.Snapshot.Failure.Error {
  const message = Str.truncate(MESSAGES[kind], 256, { ellipsis: '' });
  const error = new NativeError(message);

  defineProperties(error, {
    name: { value: 'FsSnapshotError', enumerable: true },
    operation: { value: 'file', enumerable: true },
    kind: { value: kind, enumerable: true },
  });
  FAILURES.add(error);
  return freeze(error) as t.Fs.Snapshot.Failure.Error;
}

/** Test private owner identity without traversing untrusted input. */
export function isFailure(input: unknown): input is t.Fs.Snapshot.Failure.Error {
  return Is.object(input) && !ServerIs.Native.proxy(input) && FAILURES.has(input);
}

/** Convert one host failure into the stable snapshot taxonomy. */
export function hostFailure(cause: unknown): t.Fs.Snapshot.Failure.Error {
  if (isFailure(cause)) return cause;
  const native = ServerIs.Native.error(cause) && Err.Is.error(cause) ? cause : undefined;
  if (native instanceof Deno.errors.NotFound) return failure('missing');
  if (
    native instanceof Deno.errors.NotADirectory ||
    native instanceof Deno.errors.IsADirectory ||
    native instanceof Deno.errors.FilesystemLoop
  ) {
    return failure('unsafe-filesystem');
  }
  if (
    native instanceof Deno.errors.PermissionDenied ||
    native instanceof Deno.errors.NotCapable
  ) {
    return failure('permission-denied');
  }
  return failure('io-failure');
}
