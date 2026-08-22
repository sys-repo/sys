import { Is, Num, type t } from '../common.ts';
import { checkCancelled, failure, ioFailure, isFailure } from './u.error.ts';
import type { Io, ReadHandle, ReadInfo } from './u.io.ts';
import {
  type Identity,
  identityRequired,
  observeTargetIdentity,
  type RootState,
  sameIdentity,
  type TargetObservation,
  type TargetState,
} from './u.path.ts';

const operation = 'read-file' as const;
const OPTION_KEYS = ['maxBytes', 'until'] as const;
const ABSENT: t.FsRooted.ReadFileResult = Object.freeze({ kind: 'absent' });

/** Snapshot one exact admitted-file read policy before filesystem work. */
export function readFileOptions(input: unknown): t.FsRooted.ReadFileOptions {
  try {
    if (!Is.plainObject(input)) throw failure(operation, 'invalid-options');
    const keys = Reflect.ownKeys(input);
    if (keys.some((key) => !Is.str(key) || !OPTION_KEYS.some((name) => name === key))) {
      throw failure(operation, 'invalid-options');
    }

    const maxBytes = ownValue(input, 'maxBytes');
    const until = ownValue(input, 'until');
    if (!Num.Is.safeInt(maxBytes) || maxBytes < 0 || !Is.untilInput(until)) {
      throw failure(operation, 'invalid-options');
    }
    return Object.freeze({ maxBytes, until });
  } catch {
    throw failure(operation, 'invalid-options');
  }
}

/** Read one admitted file while retaining root, path, and descriptor identity evidence. */
export async function readFile(
  io: Io,
  root: RootState,
  target: TargetState<'file'>,
  maxBytes: number,
  signal: AbortSignal,
): Promise<t.FsRooted.ReadFileResult> {
  const selectedPath = await observeTargetIdentity(io, root, target, operation, signal);
  checkCancelled(operation, signal);
  const selected = selectedPath.target;
  if (!selected) return ABSENT;
  if (selected.size > maxBytes) throw failure(operation, 'limit-exceeded');
  const identity = identityRequired(selected, operation);
  const file = await openSelected(io, root, target, selectedPath, identity, signal);

  let result: t.FsRooted.ReadFileResult | undefined;
  let primary: unknown;
  let primaryFailed = false;
  try {
    const opened = await file.stat();
    assertStableDescriptor(opened, identity, selected.size);
    if (opened.size > maxBytes) throw failure(operation, 'limit-exceeded');
    const bytes = await readExact(file, opened.size, signal);
    const completed = await file.stat();
    assertStableDescriptor(completed, identity, opened.size);

    const retainedPath = await observeTargetIdentity(io, root, target, operation, signal);
    const retained = retainedPath.target;
    if (
      !retained ||
      !sameAncestors(selectedPath, retainedPath) ||
      !sameIdentity(identity, retained) ||
      retained.size !== completed.size
    ) {
      throw failure(operation, 'unsafe-filesystem');
    }
    checkCancelled(operation, signal);
    result = Object.freeze({ kind: 'read', bytes });
  } catch (cause) {
    primaryFailed = true;
    primary = cause;
  }

  let cleanup: unknown;
  let cleanupFailed = false;
  try {
    await file.close();
  } catch (cause) {
    cleanupFailed = true;
    cleanup = cause;
  }

  if (primaryFailed && cleanupFailed) {
    const cause = new AggregateError(
      [primary, cleanup],
      'Rooted file read and descriptor cleanup failed.',
    );
    throw failure(operation, primaryKind(primary), { cause });
  }
  if (primaryFailed) throw primary;
  if (cleanupFailed) throw ioFailure(operation, cleanup);
  if (!result) throw failure(operation, 'io-failure');
  return result;
}

async function openSelected(
  io: Io,
  root: RootState,
  target: TargetState<'file'>,
  selected: TargetObservation,
  identity: Identity,
  signal: AbortSignal,
): Promise<ReadHandle> {
  try {
    return await io.openRead(target.absolute);
  } catch (cause) {
    const retainedPath = await observeTargetIdentity(io, root, target, operation, signal);
    const retained = retainedPath.target;
    if (!retained || !sameAncestors(selected, retainedPath) || !sameIdentity(identity, retained)) {
      throw failure(operation, 'unsafe-filesystem');
    }
    throw ioFailure(operation, cause);
  }
}

async function readExact(
  file: ReadHandle,
  size: number,
  signal: AbortSignal,
): Promise<Uint8Array> {
  if (!Num.Is.safeInt(size) || size < 0) throw failure(operation, 'unsupported');

  let bytes: Uint8Array;
  try {
    bytes = new Uint8Array(size);
  } catch {
    throw failure(operation, 'limit-exceeded');
  }

  let offset = 0;
  while (offset < bytes.byteLength) {
    checkCancelled(operation, signal);
    const length = await file.read(bytes.subarray(offset));
    if (length === null) throw failure(operation, 'unsafe-filesystem');
    if (!Num.Is.safeInt(length) || length <= 0 || length > bytes.byteLength - offset) {
      throw failure(operation, 'io-failure');
    }
    offset += length;
  }

  checkCancelled(operation, signal);
  const extra = await file.read(new Uint8Array(1));
  if (extra !== null) {
    if (!Num.Is.safeInt(extra) || extra <= 0 || extra > 1) {
      throw failure(operation, 'io-failure');
    }
    throw failure(operation, 'unsafe-filesystem');
  }
  return bytes;
}

function primaryKind(cause: unknown): t.FsRooted.FailureKind {
  try {
    return isFailure(cause) ? cause.kind : ioFailure(operation, cause).kind;
  } catch {
    return 'io-failure';
  }
}

function sameAncestors(a: TargetObservation, b: TargetObservation): boolean {
  if (a.ancestors.length !== b.ancestors.length) return false;
  for (let index = 0; index < a.ancestors.length; index += 1) {
    const expected = a.ancestors[index];
    const actual = b.ancestors[index];
    if (!expected || !actual || !sameIdentity(expected, actual)) return false;
  }
  return true;
}

function ownValue<K extends keyof t.FsRooted.ReadFileOptions>(
  input: object,
  key: K,
): t.FsRooted.ReadFileOptions[K] | undefined {
  const descriptor = Object.getOwnPropertyDescriptor(input, key);
  if (!descriptor) return undefined;
  if (!('value' in descriptor)) throw failure(operation, 'invalid-options');
  return descriptor.value;
}

function assertStableDescriptor(info: ReadInfo, identity: Identity, size: number): void {
  if (!info.isFile || info.isDirectory || !sameIdentity(identity, info) || info.size !== size) {
    throw failure(operation, 'unsafe-filesystem');
  }
}
