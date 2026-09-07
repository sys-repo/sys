import type { t } from '../common.ts';
import { byteLengthOf, readBytes } from './u.bytes.ts';
import { failure, hostFailure, isFailure } from './u.failure.ts';
import { snapshotOptions } from './u.input.ts';
import { DEFAULT_SNAPSHOT_IO } from './u.io.ts';
import {
  compareObservation,
  hasIdentity,
  lstat,
  requireRegularFile,
  statHandle,
} from './u.observation.ts';
import { snapshotOperation, snapshotStart } from './u.operation.ts';
import { normalizeSelection, observeSelection } from './u.selection.ts';

const freeze = Object.freeze;

/**
 * Read one bounded stable file snapshot through the public Snapshot boundary.
 */
export const snapshotFile: t.Snapshot.File.Method = (options) => snapshotFileWithIo(options);

/** Internal injectable host seam for deterministic lifecycle and race proof. */
export async function snapshotFileWithIo(
  input: unknown,
  io: t.SnapshotIo = DEFAULT_SNAPSHOT_IO,
  started = snapshotStart(),
): Promise<t.Snapshot.File.Result> {
  const options = snapshotOptions(input);
  return await snapshotOperation(
    options,
    (context) => readSnapshot(options, io, context),
    started,
  );
}

/**
 * Helpers:
 */
async function readSnapshot(
  options: t.SnapshotInput,
  io: t.SnapshotIo,
  context: t.SnapshotContext,
): Promise<t.Snapshot.File.Result> {
  const { root, path } = normalizeSelection(options);
  const beforePath = await observeSelection(root, path, io, context);

  let handle: t.SnapshotHandle | undefined;
  let result: t.Snapshot.File.Result | undefined;
  let primary: t.Snapshot.Failure.Error | undefined;
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
    // Compare every pair: optional evidence may be absent in any one observation.
    for (let left = 0; left < observations.length; left++) {
      completeIdentity = completeIdentity && hasIdentity(observations[left]);
      for (let right = left + 1; right < observations.length; right++) {
        compareObservation(observations[left], observations[right]);
      }
    }

    const byteLength = byteLengthOf(bytes);
    if (byteLength !== afterHandle.size) throw failure('source-changed');

    const evidence: t.Snapshot.Evidence.Kind = completeIdentity ? 'device-inode' : 'metadata-only';
    result = freeze({ path, byteLength, evidence, bytes });
  } catch (cause) {
    primary = asFailure(cause);
  }

  // Settle the owned handle before returning or throwing, preserving the first failure.
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

function asFailure(cause: unknown): t.Snapshot.Failure.Error {
  return isFailure(cause) ? cause : hostFailure(cause);
}

function checkpointFailure(
  context: t.SnapshotContext,
): t.Snapshot.Failure.Error | undefined {
  try {
    context.checkpoint();
    return undefined;
  } catch (cause) {
    return asFailure(cause);
  }
}
