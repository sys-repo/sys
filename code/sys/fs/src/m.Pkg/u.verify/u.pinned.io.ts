import { Is, type t } from '../common.ts';

const FAILURE = Symbol('Pkg.Dist.verifyPinned.failure');

type InternalFailure = {
  readonly [FAILURE]: true;
  readonly kind: t.Pkg.Dist.VerifyPinned.FailureKind;
};

export type ReadHandle = {
  readonly read: (buffer: Uint8Array) => Promise<number | null>;
  readonly stat: () => Promise<Deno.FileInfo>;
  readonly close: () => void;
};

/** Private host operations used by strict Dist verification. */
export type VerifyPinnedIo = {
  readonly lstat: (path: string) => Promise<Deno.FileInfo>;
  readonly open: (path: string) => Promise<ReadHandle>;
  readonly readDir: (path: string) => AsyncIterable<Deno.DirEntry>;
  readonly realPath: (path: string) => Promise<string>;
};

export const DEFAULT_IO: VerifyPinnedIo = Object.freeze({
  lstat: (path) => Deno.lstat(path),
  open: (path) => Deno.open(path, { read: true }),
  readDir: (path) => Deno.readDir(path),
  realPath: (path) => Deno.realPath(path),
});

export function failure(kind: t.Pkg.Dist.VerifyPinned.FailureKind): InternalFailure {
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
