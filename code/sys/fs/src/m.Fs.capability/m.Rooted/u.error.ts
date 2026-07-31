import { Is, Rx, type t } from './common.ts';

const NAME = 'FsRootedError' as const;
const OPERATIONS: readonly t.FsRooted.Operation[] = [
  'create',
  'admit',
  'publish-file',
  'create-stage',
  'discard-stage',
  'promote-stage',
];
const KINDS: readonly t.FsRooted.FailureKind[] = [
  'cancelled',
  'invalid-root',
  'invalid-target',
  'target-collision',
  'unsafe-filesystem',
  'foreign-handle',
  'invalid-state',
  'occupied',
  'ownership-lost',
  'unsupported',
  'io-failure',
];

export function failure(
  operation: t.FsRooted.Operation,
  kind: t.FsRooted.FailureKind,
  options: { readonly cause?: unknown; readonly committed?: boolean } = {},
): t.FsRooted.Failure {
  const error = new Error(message(kind), { cause: options.cause }) as t.FsRooted.Failure;
  Object.defineProperties(error, {
    name: { value: NAME, enumerable: true },
    operation: { value: operation, enumerable: true },
    kind: { value: kind, enumerable: true },
    committed: { value: options.committed ?? false, enumerable: true },
  });
  return error;
}

export function isFailure(input: unknown): input is t.FsRooted.Failure {
  if (!Is.object(input)) return false;
  const value = input as Partial<t.FsRooted.Failure>;
  return (
    value.name === NAME &&
    Is.str(value.operation) &&
    OPERATIONS.includes(value.operation as t.FsRooted.Operation) &&
    Is.str(value.kind) &&
    KINDS.includes(value.kind as t.FsRooted.FailureKind) &&
    Is.bool(value.committed)
  );
}

export function checkCancelled(
  operation: t.FsRooted.Operation,
  signal: AbortSignal,
  committed = false,
): void {
  if (signal.aborted) {
    throw failure(operation, 'cancelled', { cause: signal.reason, committed });
  }
}

export async function runOperation<T>(
  operation: t.FsRooted.Operation,
  options: t.FsRooted.OperationOptions | undefined,
  fn: (signal: AbortSignal) => Promise<T>,
): Promise<T> {
  const life = Rx.abortable(options?.until);
  try {
    checkCancelled(operation, life.signal);
    return await fn(life.signal);
  } finally {
    life.dispose();
  }
}

export function ioFailure(
  operation: t.FsRooted.Operation,
  cause: unknown,
  committed = false,
): t.FsRooted.Failure {
  if (isFailure(cause)) return cause;
  if (cause instanceof Deno.errors.NotSupported) {
    return failure(operation, 'unsupported', { cause, committed });
  }
  return failure(operation, 'io-failure', { cause, committed });
}

function message(kind: t.FsRooted.FailureKind): string {
  switch (kind) {
    case 'cancelled':
      return 'Rooted filesystem operation cancelled';
    case 'invalid-root':
      return 'Invalid rooted filesystem directory';
    case 'invalid-target':
      return 'Invalid rooted filesystem target';
    case 'target-collision':
      return 'Rooted filesystem target batch contains a collision';
    case 'unsafe-filesystem':
      return 'Unsafe filesystem state observed';
    case 'foreign-handle':
      return 'Filesystem handle does not belong to this rooted capability';
    case 'invalid-state':
      return 'Rooted filesystem handle is not active';
    case 'occupied':
      return 'Rooted filesystem target is occupied';
    case 'ownership-lost':
      return 'Rooted filesystem ownership could not be proven';
    case 'unsupported':
      return 'Required filesystem operation is unsupported';
    case 'io-failure':
      return 'Rooted filesystem IO failed';
  }
}
