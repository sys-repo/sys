import { Is, type t } from './common.ts';
import type { VerifyIo } from '../t.internal.ts';

const FAILURE = Symbol('Pkg.Dist.Pinned.failure');

type InternalFailure = {
  readonly [FAILURE]: true;
  readonly kind: t.Pkg.Dist.Verify.FailureKind;
};

export const DEFAULT_IO: VerifyIo = Object.freeze({
  lstat: (path) => Deno.lstat(path),
  open: (path) => Deno.open(path, { read: true }),
  readDir: (path) => Deno.readDir(path),
  realPath: (path) => Deno.realPath(path),
});

export function failure(kind: t.Pkg.Dist.Verify.FailureKind): InternalFailure {
  return Object.freeze({ [FAILURE]: true as const, kind });
}

export function isFailure(input: unknown): input is InternalFailure {
  if (!Is.object(input)) return false;
  return (input as Partial<InternalFailure>)[FAILURE] === true;
}

export function checkCancelled(signal: AbortSignal): void {
  if (signal.aborted) throw failure('cancelled');
}

export function ioFailure(cause: unknown): InternalFailure {
  if (isFailure(cause)) return cause;
  if (cause instanceof Deno.errors.NotSupported) return failure('unsupported');
  return failure('io-failure');
}
