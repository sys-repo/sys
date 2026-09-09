import { Fs, Is, Rx, Schedule, type t } from './common.ts';
import { materialize } from '../u.materialize/mod.ts';
import { type InputSnapshot, snapshotInput } from './u.input.ts';
import {
  type Acquisition,
  admitAcquisition,
  admitRooted,
  admitTarget,
  createOwner,
  releaseFailedOpen,
} from './u.owner.ts';
import { dataValue, isDirectCallable, isExactPromise } from './u.is.ts';
import { retainOpaqueOpen, retainUnobservableOpen } from './u.retention.ts';
import { admitMaterializeResult, failed, materializationFailed, opened } from './u.result.ts';

/**
 * Package-internal trusted callables for deterministic opening proof.
 *
 * Each operation must return an exact undecorated native Promise. Returned evidence remains
 * untrusted and is admitted independently.
 */
export type GenerationDependencies = {
  ensureDir: typeof Fs.ensureDir;
  realPath: typeof Fs.realPath;
  rooted: t.FsRooted.Lib;
  materialize: t.Dist.Materialize;
};

/** Package-internal production dependencies. */
export const DEFAULT_DEPENDENCIES: Readonly<GenerationDependencies> = Object.freeze({
  ensureDir: Fs.ensureDir,
  realPath: async (path) => await Fs.realPath(path),
  rooted: Fs.Capability.Rooted,
  materialize,
});

const apply = Reflect.apply;
const freeze = Object.freeze;

/**
 * Open one verified generation under retained shared package-store ownership.
 */
export const open: t.Dist.Generation.Open.Method = (input) => openWith(input);

/** Package-internal deterministic seam for owner and lower-settlement proof. */
export async function openWith(
  input: unknown,
  dependencies: GenerationDependencies = DEFAULT_DEPENDENCIES,
): Promise<t.Dist.Generation.Open.Result> {
  const args = snapshotInput(input);
  if (!args) return failed('input', 'invalid-input', 'not-acquired');

  let until: t.UntilInput;
  try {
    if (!Is.untilInput(args.until)) return failed('input', 'invalid-input', 'not-acquired');
    until = args.until;
  } catch {
    return failed('input', 'invalid-input', 'not-acquired');
  }

  let life: t.Abortable;
  try {
    life = Rx.abortable(until);
  } catch {
    return failed('input', 'execution-failure', 'not-acquired');
  }

  try {
    try {
      await Schedule.micro(); // Let synchronous lifecycle bridges publish pre-existing cancellation.
    } catch {
      return failed('input', 'execution-failure', 'not-acquired');
    }
    if (life.signal.aborted) return failed('input', 'cancelled', 'not-acquired');
    return await openPrepared(args, dependencies, life.signal);
  } finally {
    try {
      life.dispose();
    } catch {
      // Opening settlements remain bounded after caller lifecycle observation has ended.
    }
  }
}

async function openPrepared(
  args: InputSnapshot,
  dependencies: GenerationDependencies,
  signal: AbortSignal,
): Promise<t.Dist.Generation.Open.Result> {
  const ensureDir = dependencies.ensureDir;
  if (!isDirectCallable(ensureDir)) {
    return failed('store', failureReason(signal, 'execution-failure'), 'not-acquired');
  }
  let preparation: unknown;
  try {
    preparation = apply(ensureDir, undefined, [args.store.root]);
  } catch {
    return failed('store', failureReason(signal, 'filesystem-failure'), 'not-acquired');
  }
  if (!isExactPromise(preparation)) {
    return failed('store', failureReason(signal, 'execution-failure'), 'not-acquired');
  }
  try {
    await preparation;
  } catch {
    return failed('store', failureReason(signal, 'filesystem-failure'), 'not-acquired');
  }
  if (signal.aborted) return failed('store', 'cancelled', 'not-acquired');

  const realPath = dependencies.realPath;
  if (!isDirectCallable(realPath)) {
    return failed('store', failureReason(signal, 'execution-failure'), 'not-acquired');
  }
  let canonicalization: unknown;
  try {
    canonicalization = apply(realPath, undefined, [args.store.root]);
  } catch {
    return failed('store', failureReason(signal, 'filesystem-failure'), 'not-acquired');
  }
  if (!isExactPromise(canonicalization)) {
    return failed('store', failureReason(signal, 'execution-failure'), 'not-acquired');
  }

  let canonicalRoot: t.StringAbsoluteDir;
  try {
    const value = await canonicalization;
    if (
      !Is.str(value) || value.includes('\0') || !Fs.Path.Is.absolute(value) ||
      Fs.resolve(value) !== value
    ) {
      return failed('store', 'execution-failure', 'not-acquired');
    }
    canonicalRoot = value;
  } catch {
    return failed('store', failureReason(signal, 'filesystem-failure'), 'not-acquired');
  }
  if (signal.aborted) return failed('store', 'cancelled', 'not-acquired');

  const rootedLib = dependencies.rooted;
  if (!Is.object(rootedLib) || Is.Native.proxy(rootedLib)) {
    return failed('store', failureReason(signal, 'execution-failure'), 'not-acquired');
  }
  const createRooted = dataValue(rootedLib, 'create');
  if (!isDirectCallable(createRooted)) {
    return failed('store', failureReason(signal, 'execution-failure'), 'not-acquired');
  }
  let rootedOperation: unknown;
  try {
    rootedOperation = apply(createRooted, rootedLib, [freeze({
      root: canonicalRoot,
      create: false,
      until: signal,
    })]);
  } catch {
    return failed('store', failureReason(signal, 'filesystem-failure'), 'not-acquired');
  }
  if (!isExactPromise(rootedOperation)) {
    return failed('store', failureReason(signal, 'execution-failure'), 'not-acquired');
  }

  let lowerRooted: unknown;
  try {
    lowerRooted = await rootedOperation;
  } catch {
    return failed('store', failureReason(signal, 'filesystem-failure'), 'not-acquired');
  }
  let rooted: ReturnType<typeof admitRooted>;
  try {
    rooted = admitRooted(lowerRooted, canonicalRoot);
  } catch {
    return failed('store', 'execution-failure', 'not-acquired');
  }
  if (!rooted) return failed('store', 'execution-failure', 'not-acquired');
  if (signal.aborted) return failed('store', 'cancelled', 'not-acquired');

  let admissionOperation: unknown;
  try {
    admissionOperation = apply(rooted.admit, rooted.targetReceiver, [
      freeze([freeze({ kind: 'directory', path: args.store.target })]),
      freeze({ until: signal }),
    ]);
  } catch {
    return failed('store', failureReason(signal, 'filesystem-failure'), 'not-acquired');
  }
  if (!isExactPromise(admissionOperation)) {
    return failed('store', failureReason(signal, 'execution-failure'), 'not-acquired');
  }

  let lowerAdmission: unknown;
  try {
    lowerAdmission = await admissionOperation;
  } catch {
    return failed('store', failureReason(signal, 'filesystem-failure'), 'not-acquired');
  }
  let target: ReturnType<typeof admitTarget>;
  try {
    target = admitTarget(lowerAdmission, args.store.target);
  } catch {
    return failed('store', 'execution-failure', 'not-acquired');
  }
  if (!target) return failed('store', 'execution-failure', 'not-acquired');
  if (signal.aborted) return failed('store', 'cancelled', 'not-acquired');

  let acquisitionOperation: unknown;
  try {
    acquisitionOperation = apply(rooted.acquire, rooted.leaseReceiver, [
      freeze([target]),
      freeze({ mode: 'shared', wait: false, until: signal }),
    ]);
  } catch {
    return failed('store', failureReason(signal, 'filesystem-failure'), 'not-acquired');
  }
  if (!isExactPromise(acquisitionOperation)) {
    retainOpaqueOpen(acquisitionOperation);
    return failed(
      'store',
      failureReason(signal, 'execution-failure'),
      'pending',
    );
  }

  let lowerAcquisition: unknown;
  try {
    lowerAcquisition = await acquisitionOperation;
  } catch {
    return failed('store', failureReason(signal, 'filesystem-failure'), 'not-acquired');
  }

  let acquisition: Acquisition;
  try {
    acquisition = admitAcquisition(lowerAcquisition, target);
  } catch {
    retainOpaqueOpen(lowerAcquisition);
    return failed('store', 'execution-failure', 'pending');
  }
  if (acquisition.kind === 'invalid') return await invalidAcquisition(acquisition);
  if (signal.aborted) {
    return acquisition.kind === 'busy'
      ? failed('store', 'cancelled', 'not-acquired')
      : await ownedFailure(acquisition, 'store', 'cancelled');
  }
  if (acquisition.kind === 'busy') return failed('store', 'busy', 'not-acquired');

  const store: t.Dist.Generation.Store.Admitted = freeze({
    root: rooted.path,
    target: target.path,
    dir: Fs.join(rooted.path, target.path),
  });
  const generationDir: t.StringAbsoluteDir = Fs.join(store.dir, args.manifest.integrity);
  const materializeArgs: t.Dist.MaterializeArgs = freeze({
    manifestUrl: args.manifest.manifestUrl,
    integrity: args.manifest.integrity,
    storeDir: store.dir,
    policy: args.manifest.policy,
    ...(args.manifest.credentials ? { credentials: args.manifest.credentials } : {}),
    until: signal,
  });

  const materialize = dependencies.materialize;
  if (!isDirectCallable(materialize)) {
    return await ownedFailure(
      acquisition,
      'materialization',
      failureReason(signal, 'execution-failure'),
    );
  }
  let lowerOperation: unknown;
  try {
    lowerOperation = apply(materialize, undefined, [materializeArgs]);
  } catch {
    return await ownedFailure(
      acquisition,
      'materialization',
      failureReason(signal, 'execution-failure'),
    );
  }
  if (!isExactPromise(lowerOperation)) {
    retainUnobservableOpen(acquisition.lease, lowerOperation);
    return failed('materialization', 'execution-failure', 'pending');
  }

  let lowerGeneration: unknown;
  try {
    lowerGeneration = await lowerOperation;
  } catch {
    return await ownedFailure(
      acquisition,
      'materialization',
      failureReason(signal, 'execution-failure'),
    );
  }
  let generation: t.Dist.MaterializeResult | undefined;
  try {
    generation = admitMaterializeResult(lowerGeneration, {
      args,
      dir: generationDir,
    });
  } catch {
    return await ownedFailure(acquisition, 'materialization', 'execution-failure');
  }
  if (!generation) {
    return await ownedFailure(acquisition, 'materialization', 'execution-failure');
  }
  if (generation.kind === 'failed') {
    const ownership = await releaseFailedOpen(acquisition.lease);
    return materializationFailed(generation, ownership);
  }
  if (signal.aborted) {
    return await ownedFailure(acquisition, 'materialization', 'cancelled');
  }

  const owner = createOwner(store, acquisition.lease);
  return opened(generation, owner);
}

async function invalidAcquisition(
  acquisition: Extract<Acquisition, { readonly kind: 'invalid' }>,
): Promise<t.Dist.Generation.Failure.Result> {
  if (acquisition.lease) {
    const ownership = await releaseFailedOpen(acquisition.lease);
    return failed('store', 'execution-failure', ownership);
  }
  retainOpaqueOpen(acquisition.evidence);
  return failed('store', 'execution-failure', 'pending');
}

async function ownedFailure(
  acquisition: Extract<Acquisition, { readonly kind: 'acquired' }>,
  phase: 'store' | 'materialization',
  reason: Extract<t.Dist.Generation.Failure.Reason, 'cancelled' | 'execution-failure'>,
): Promise<t.Dist.Generation.Failure.Result> {
  const ownership = await releaseFailedOpen(acquisition.lease);
  return failed(phase, reason, ownership);
}

function failureReason<
  R extends Extract<
    t.Dist.Generation.Failure.Reason,
    'filesystem-failure' | 'execution-failure'
  >,
>(
  signal: AbortSignal,
  fallback: R,
): 'cancelled' | R {
  return signal.aborted ? 'cancelled' : fallback;
}
