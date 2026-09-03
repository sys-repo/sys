import { Num, ServerIs, StdPath, type t } from '../common.ts';
import { failure, hostFailure, isFailure } from './u.snapshot.failure.ts';
import { normalizedPath, type SnapshotInput, snapshotOptions } from './u.snapshot.input.ts';
import { DEFAULT_SNAPSHOT_IO, type SnapshotHandle, type SnapshotIo } from './u.snapshot.io.ts';
import { type SnapshotContext, snapshotOperation, snapshotStart } from './u.snapshot.operation.ts';

const NativeArrayBuffer = ArrayBuffer;
const NativeDate = Date;
const NativeUint8Array = Uint8Array;
const freeze = Object.freeze;
const getPrototypeOf = Object.getPrototypeOf;
const typedArrayPrototype = getPrototypeOf(NativeUint8Array.prototype);
const getTypedArrayBuffer = Object.getOwnPropertyDescriptor(typedArrayPrototype, 'buffer')!.get!;
const getTypedArrayByteLength = Object.getOwnPropertyDescriptor(
  typedArrayPrototype,
  'byteLength',
)!.get!;
const getTypedArrayByteOffset = Object.getOwnPropertyDescriptor(
  typedArrayPrototype,
  'byteOffset',
)!.get!;
const getArrayBufferByteLength = Object.getOwnPropertyDescriptor(
  NativeArrayBuffer.prototype,
  'byteLength',
)!.get!;
const getArrayBufferDetached = Object.getOwnPropertyDescriptor(
  NativeArrayBuffer.prototype,
  'detached',
)?.get;
const getArrayBufferResizable = Object.getOwnPropertyDescriptor(
  NativeArrayBuffer.prototype,
  'resizable',
)?.get;
const setTypedArray = Object.getOwnPropertyDescriptor(typedArrayPrototype, 'set')!.value as (
  this: Uint8Array,
  source: Uint8Array,
  offset?: number,
) => void;
const subarrayTypedArray = Object.getOwnPropertyDescriptor(
  typedArrayPrototype,
  'subarray',
)!.value as (this: Uint8Array, start: number, end: number) => Uint8Array;
const getTime = NativeDate.prototype.getTime;

const READ_BYTES = 64 * 1024;
const PATH_SEPARATOR = Deno.build.os === 'windows' ? '\\' : '/';

type Observation = {
  readonly file: boolean;
  readonly directory: boolean;
  readonly symlink: boolean;
  readonly size: number;
  readonly modified: number | null;
  readonly changed: number | null;
  readonly device: number | null;
  readonly inode: number | null;
};

/** Read one bounded stable file snapshot through an injectable host seam. */
export async function snapshotFile(
  input: unknown,
  io: SnapshotIo = DEFAULT_SNAPSHOT_IO,
  started = snapshotStart(),
): Promise<t.Fs.Snapshot.File.Result> {
  const options = snapshotOptions(input);
  return await snapshotOperation(
    options,
    (context) => readSnapshot(options, io, context),
    started,
  );
}

async function readSnapshot(
  options: SnapshotInput,
  io: SnapshotIo,
  context: SnapshotContext,
): Promise<t.Fs.Snapshot.File.Result> {
  const { root, path } = normalizeSelection(options);
  const beforePath = await observeSelection(root, path, io, context);

  let handle: SnapshotHandle | undefined;
  let result: t.Fs.Snapshot.File.Result | undefined;
  let primary: t.Fs.Snapshot.Failure.Error | undefined;
  try {
    context.checkpoint();
    try {
      handle = await io.open(path);
    } catch (cause) {
      context.checkpoint();
      throw hostFailure(cause);
    }
    context.checkpoint();

    const beforeHandle = await statHandle(handle, context);
    requireRegularFile(beforeHandle);
    compareObservation(beforePath, beforeHandle);

    const afterOpenPath = await lstat(io, path, context);
    requireRegularFile(afterOpenPath);
    compareObservation(beforePath, afterOpenPath);
    compareObservation(beforeHandle, afterOpenPath);

    const bytes = await readBytes(handle, options.maxBytes, context);
    const afterHandle = await statHandle(handle, context);
    requireRegularFile(afterHandle);

    const observations = [beforePath, beforeHandle, afterOpenPath, afterHandle] as const;
    let completeIdentity = true;
    for (let left = 0; left < observations.length; left++) {
      completeIdentity = completeIdentity && hasIdentity(observations[left]);
      for (let right = left + 1; right < observations.length; right++) {
        compareObservation(observations[left], observations[right]);
      }
    }

    const byteLength = getTypedArrayByteLength.call(bytes) as number;
    if (byteLength !== afterHandle.size) throw failure('source-changed');

    const evidence: t.Fs.Snapshot.Evidence.Kind = completeIdentity
      ? 'device-inode'
      : 'metadata-only';
    result = freeze({ path, byteLength, evidence, bytes });
  } catch (cause) {
    primary = asFailure(cause);
  }

  if (handle) {
    if (!primary) primary = checkpointFailure(context);
    try {
      await handle.close();
    } catch {
      if (!primary) {
        primary = checkpointFailure(context) ?? failure('io-failure');
      }
    }
  }
  if (primary) throw primary;
  context.checkpoint();
  return result!;
}

function normalizeSelection(options: SnapshotInput): {
  readonly root: t.StringAbsoluteDir;
  readonly path: t.StringAbsolutePath;
} {
  let root: string;
  let path: string;
  try {
    root = normalizedPath(StdPath.resolve(options.root), 'invalid-root');
  } catch (cause) {
    if (isFailure(cause)) throw cause;
    throw failure('invalid-root');
  }
  try {
    path = normalizedPath(StdPath.resolve(options.path), 'invalid-path');
  } catch (cause) {
    if (isFailure(cause)) throw cause;
    throw failure('invalid-path');
  }
  const relative = StdPath.relative(root, path);
  if (!relative || StdPath.Is.absolute(relative) || !StdPath.Is.within(root, path)) {
    throw failure('invalid-path');
  }
  return { root: root as t.StringAbsoluteDir, path: path as t.StringAbsolutePath };
}

async function observeSelection(
  root: t.StringAbsoluteDir,
  path: t.StringAbsolutePath,
  io: SnapshotIo,
  context: SnapshotContext,
): Promise<Observation> {
  const rootInfo = await lstat(io, root, context);
  if (rootInfo.symlink || !rootInfo.directory) throw failure('unsafe-filesystem');

  const relative = StdPath.relative(root, path);
  if (!relative || StdPath.Is.absolute(relative)) throw failure('invalid-path');
  const segments = relative.split(PATH_SEPARATOR);
  let current = root as string;
  let final: Observation | undefined;
  for (let index = 0; index < segments.length; index++) {
    const segment = segments[index];
    if (!segment || segment === '.' || segment === '..') throw failure('invalid-path');
    const isFinal = index === segments.length - 1;
    current = isFinal ? path : StdPath.join(current, segment);
    if (!StdPath.Is.within(root, current)) throw failure('invalid-path');

    const observation = await lstat(io, current, context);
    if (observation.symlink) throw failure('unsafe-filesystem');
    if (!isFinal && !observation.directory) throw failure('unsafe-filesystem');
    if (isFinal) {
      requireRegularFile(observation);
      final = observation;
    }
  }
  return final!;
}

async function lstat(
  io: SnapshotIo,
  path: string,
  context: SnapshotContext,
): Promise<Observation> {
  context.checkpoint();
  try {
    const result = observe(await io.lstat(path));
    context.checkpoint();
    return result;
  } catch (cause) {
    if (isFailure(cause)) throw cause;
    context.checkpoint();
    throw hostFailure(cause);
  }
}

async function statHandle(
  handle: SnapshotHandle,
  context: SnapshotContext,
): Promise<Observation> {
  context.checkpoint();
  try {
    const result = observe(await handle.stat());
    context.checkpoint();
    return result;
  } catch (cause) {
    if (isFailure(cause)) throw cause;
    context.checkpoint();
    throw hostFailure(cause);
  }
}

async function readBytes(
  handle: SnapshotHandle,
  maxBytes: number,
  context: SnapshotContext,
): Promise<Uint8Array> {
  const chunks: Array<{ readonly bytes: Uint8Array; readonly length: number }> = [];
  let total = 0;
  let done = false;

  while (!done) {
    context.checkpoint();
    const capacity = Math.min(READ_BYTES, maxBytes - total + 1);
    const slab = new NativeUint8Array(capacity);
    let used = 0;

    while (used < capacity) {
      context.checkpoint();
      const request = used === 0 ? slab : subarrayTypedArray.call(slab, used, capacity);
      let count: number | null;
      try {
        count = await handle.read(request);
      } catch (cause) {
        context.checkpoint();
        throw hostFailure(cause);
      }
      context.checkpoint();
      if (count === null) {
        done = true;
        break;
      }
      const requestLength = getTypedArrayByteLength.call(request) as number;
      if (!Num.Is.safeInt(count) || count <= 0 || count > requestLength) {
        throw failure('io-failure');
      }
      if (total + count > maxBytes) throw failure('source-limit');

      used += count;
      total += count;
      await context.yield();
    }

    if (used > 0) chunks.push({ bytes: slab, length: used });
  }

  context.checkpoint();
  const bytes = new NativeUint8Array(total);
  context.checkpoint();
  let offset = 0;
  for (let index = 0; index < chunks.length; index++) {
    const chunk = chunks[index];
    context.checkpoint();
    const source = chunk.length === getTypedArrayByteLength.call(chunk.bytes)
      ? chunk.bytes
      : subarrayTypedArray.call(chunk.bytes, 0, chunk.length);
    setTypedArray.call(bytes, source, offset);
    offset += chunk.length;
    await context.yield();
  }
  assertOwnedBytes(bytes, total);
  return bytes;
}

function observe(info: Deno.FileInfo): Observation {
  return freeze({
    file: info.isFile,
    directory: info.isDirectory,
    symlink: info.isSymlink,
    size: info.size,
    modified: observedTime(info.mtime),
    changed: observedTime(info.ctime),
    device: identityPart(info.dev),
    inode: identityPart(info.ino),
  });
}

function observedTime(input: Date | null): number | null {
  if (input === null) return null;
  try {
    const value = getTime.call(input);
    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

function identityPart(input: number | null): number | null {
  return Num.Is.safeInt(input) && input >= 0 ? input : null;
}

function hasIdentity(input: Observation): boolean {
  return input.device !== null && input.inode !== null;
}

function requireRegularFile(input: Observation): void {
  if (input.symlink || !input.file || input.directory) throw failure('unsafe-filesystem');
  if (!Num.Is.safeInt(input.size) || input.size < 0) throw failure('source-changed');
}

function compareObservation(left: Observation, right: Observation): void {
  if (
    left.file !== right.file || left.directory !== right.directory || left.symlink !== right.symlink
  ) {
    throw failure('source-changed');
  }
  if (left.size !== right.size) throw failure('source-changed');
  if (left.modified !== null && right.modified !== null && left.modified !== right.modified) {
    throw failure('source-changed');
  }
  if (left.changed !== null && right.changed !== null && left.changed !== right.changed) {
    throw failure('source-changed');
  }
  if (
    hasIdentity(left) &&
    hasIdentity(right) &&
    (left.device !== right.device || left.inode !== right.inode)
  ) {
    throw failure('source-changed');
  }
}

function assertOwnedBytes(input: Uint8Array, expected: number): void {
  const backing = getTypedArrayBuffer.call(input) as ArrayBufferLike;
  if (
    ServerIs.Native.proxy(input) ||
    !ServerIs.Native.uint8Array(input) ||
    getPrototypeOf(input) !== NativeUint8Array.prototype ||
    getTypedArrayByteLength.call(input) !== expected ||
    getTypedArrayByteOffset.call(input) !== 0 ||
    ServerIs.Native.sharedArrayBuffer(backing) ||
    getPrototypeOf(backing) !== NativeArrayBuffer.prototype ||
    getArrayBufferByteLength.call(backing) !== expected ||
    getArrayBufferDetached?.call(backing) === true ||
    getArrayBufferResizable?.call(backing) === true
  ) {
    throw failure('io-failure');
  }
}

function asFailure(cause: unknown): t.Fs.Snapshot.Failure.Error {
  return isFailure(cause) ? cause : hostFailure(cause);
}

function checkpointFailure(
  context: SnapshotContext,
): t.Fs.Snapshot.Failure.Error | undefined {
  try {
    context.checkpoint();
    return undefined;
  } catch (cause) {
    return asFailure(cause);
  }
}
