import { Is, Str, type t } from '../common.ts';

const NativeError = Error;
const FAILURES = new WeakSet<object>();
const DEFAULT_MESSAGE_LIMIT = 1024;

const MESSAGES: Readonly<Record<t.Zip.Failure.Kind, string>> = Object.freeze({
  'invalid-input': 'Invalid ZIP input',
  'invalid-options': 'Invalid ZIP operation options',
  'cancelled': 'ZIP operation cancelled',
  'timeout': 'ZIP operation timed out',
  'source-limit': 'ZIP source byte limit exceeded',
  'entry-limit': 'ZIP entry limit exceeded',
  'tree-limit': 'ZIP realized tree limit exceeded',
  'path-limit': 'ZIP entry path limit exceeded',
  'expanded-limit': 'ZIP expanded byte limit exceeded',
  'malformed': 'Malformed ZIP32 archive',
  'unsupported': 'Unsupported ZIP feature',
  'invalid-name': 'Invalid ZIP entry name',
  'collision': 'ZIP entry path collision',
  'deflate-failure': 'ZIP DEFLATE stream failed',
  'size-mismatch': 'ZIP expanded size mismatch',
  'crc-mismatch': 'ZIP CRC-32 mismatch',
});

type FailureOptions = {
  readonly maxErrorChars?: number;
  readonly entryIndex?: number;
  readonly cause?: unknown;
  readonly detail?: string;
};

/** Create one frozen owner-authenticated public failure. */
export function failure(
  operation: t.Zip.Operation,
  kind: t.Zip.Failure.Kind,
  options: FailureOptions = {},
): t.Zip.Failure.Error {
  const max = options.maxErrorChars ?? DEFAULT_MESSAGE_LIMIT;
  const text = options.detail ? `${MESSAGES[kind]}: ${options.detail}` : MESSAGES[kind];
  const message = Str.truncate(text, max, { ellipsis: '' });
  const error = options.cause === undefined
    ? new NativeError(message)
    : new NativeError(message, { cause: options.cause });

  Object.defineProperties(error, {
    name: { value: 'ZipError', enumerable: true },
    operation: { value: operation, enumerable: true },
    kind: { value: kind, enumerable: true },
    ...(options.entryIndex === undefined
      ? {}
      : { entryIndex: { value: options.entryIndex, enumerable: true } }),
  });

  FAILURES.add(error);
  return Object.freeze(error) as t.Zip.Failure.Error;
}

/** Test private owner identity without traversing untrusted values. */
export function isFailure(input: unknown): input is t.Zip.Failure.Error {
  return Is.object(input) && !Is.Native.proxy(input) && FAILURES.has(input);
}
