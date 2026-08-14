import { Is, Num, StdPath, type t } from '../common.ts';
import { checkCancelled, failure, ioFailure, isFailure } from './u.error.ts';
import type { Io } from './u.io.ts';
import {
  borrowLease,
  hasLocalLease,
  type LeaseBorrow,
  type LeaseRegistry,
  type LeaseState,
  releaseLeaseBorrow,
} from './u.lease.ts';
import { acquireLock, type LockState, releaseLock } from './u.lock.ts';
import {
  changeEntryMode,
  inspectTreeSeal,
  removeTreeEntries,
  sealTreeEntries,
  type TreeAuthority,
} from './u.tree.ts';
import {
  ensureDescendantDirectory,
  type Identity,
  identityRequired,
  INTERNAL_NAME,
  lstatMaybe,
  observeTarget,
  revalidateRoot,
  type RootState,
  sameIdentity,
  type TargetState,
} from './u.path.ts';

const STAGES = 'stages';
const OWNER = 'owner';
const CONTENT = 'content';
const CLEANUP_SIGNAL = new AbortController().signal;

export type PromotionInput = {
  readonly seal: boolean;
  readonly lease?: t.FsRooted.Lease;
  readonly until?: t.UntilInput;
};

export type StageState = {
  readonly handle: t.FsRooted.Stage;
  readonly container: string;
  readonly marker: string;
  readonly content: string;
  readonly token: string;
  readonly containerIdentity: Identity;
  readonly markerIdentity: Identity;
  readonly contentIdentity: Identity;
  publishedCleanup: 'marker-required' | 'authorized';
  status: 'active' | 'discarding' | 'published' | 'discarded';
};

/** Snapshot exact promotion and sealing input before filesystem work. */
export function promotionInput(
  options: t.FsRooted.PromotionOptions | undefined,
): PromotionInput {
  const operation = 'promote-stage';
  try {
    if (options === undefined) return Object.freeze({ seal: false });
    if (!Is.plainObject(options)) throw failure(operation, 'invalid-options');
    const keys = Reflect.ownKeys(options);
    if (keys.some((key) => key !== 'until' && key !== 'seal' && key !== 'lease')) {
      throw failure(operation, 'invalid-options');
    }
    const untilProperty = Reflect.getOwnPropertyDescriptor(options, 'until');
    const sealProperty = Reflect.getOwnPropertyDescriptor(options, 'seal');
    const leaseProperty = Reflect.getOwnPropertyDescriptor(options, 'lease');
    if (
      (untilProperty && !('value' in untilProperty)) ||
      (sealProperty && !('value' in sealProperty)) ||
      (leaseProperty && !('value' in leaseProperty))
    ) {
      throw failure(operation, 'invalid-options');
    }
    const until = untilProperty?.value;
    const seal = sealProperty?.value;
    const lease = leaseProperty?.value;
    if (!Is.untilInput(until) || !(seal === undefined || Is.bool(seal))) {
      throw failure(operation, 'invalid-options');
    }
    if (!(lease === undefined || Is.object(lease))) throw failure(operation, 'invalid-lease');
    return Object.freeze({
      until,
      seal: seal === true,
      lease: lease as t.FsRooted.Lease | undefined,
    });
  } catch (cause) {
    if (isFailure(cause)) throw cause;
    throw failure(operation, 'invalid-options');
  }
}

export async function createStage(
  io: Io,
  root: RootState,
  signal: AbortSignal,
  createChild: (root: string) => Promise<t.FsRooted.Instance>,
  stages: WeakMap<object, StageState>,
): Promise<t.FsRooted.Stage> {
  const operation = 'create-stage';
  await revalidateRoot(io, root, operation);
  const base = StdPath.join(root.path, INTERNAL_NAME, STAGES);
  await ensureDescendantDirectory(io, root, base, operation, signal);

  let container = '';
  for (let attempt = 0; attempt < 16; attempt++) {
    checkCancelled(operation, signal);
    container = StdPath.join(base, io.token());
    try {
      await io.mkdir(container, { mode: 0o700 });
      break;
    } catch (cause) {
      if (cause instanceof Deno.errors.AlreadyExists) {
        container = '';
        continue;
      }
      throw ioFailure(operation, cause);
    }
  }
  if (!container) throw failure(operation, 'io-failure');

  const containerInfo = await lstatMaybe(io, container, operation);
  if (!containerInfo?.isDirectory || containerInfo.isSymlink) {
    throw failure(operation, 'ownership-lost');
  }
  const containerIdentity = identityRequired(containerInfo, operation);
  const marker = StdPath.join(container, OWNER);
  const token = io.token();

  try {
    const markerIdentity = await writeMarker(io, marker, token, signal);
    checkCancelled(operation, signal);
    const content = StdPath.join(container, CONTENT);
    await io.mkdir(content, { mode: 0o700 });
    const contentInfo = await lstatMaybe(io, content, operation);
    if (!contentInfo?.isDirectory || contentInfo.isSymlink) {
      throw failure(operation, 'ownership-lost');
    }
    const contentIdentity = identityRequired(contentInfo, operation);
    checkCancelled(operation, signal);
    const files = await createChild(content);
    checkCancelled(operation, signal);
    const handle = Object.freeze({ path: files.path, files }) as t.FsRooted.Stage;
    const state: StageState = {
      handle,
      container,
      marker,
      content,
      token,
      containerIdentity,
      markerIdentity,
      contentIdentity,
      publishedCleanup: 'marker-required',
      status: 'active',
    };
    stages.set(handle, state);
    return handle;
  } catch (cause) {
    let pending = cause;
    try {
      await removeContainer(io, container, containerIdentity, operation);
    } catch (cleanupCause) {
      pending = cleanupCause;
    }
    if (isFailure(pending)) throw pending;
    throw ioFailure(operation, pending);
  }
}

export async function discardStage(
  io: Io,
  stages: WeakMap<object, StageState>,
  stage: t.FsRooted.Stage,
): Promise<void> {
  const operation = 'discard-stage';
  const state = stageState(stages, stage, operation);
  if (state.status === 'discarded') return;
  if (state.status === 'published') {
    await cleanupPublished(io, state, operation);
    return;
  }
  if (state.status === 'active') {
    await validateActive(io, state, operation);
    state.status = 'discarding';
  }
  await removeContainer(io, state.container, state.containerIdentity, operation);
  state.status = 'discarded';
}

export async function promoteStage(
  io: Io,
  root: RootState,
  stages: WeakMap<object, StageState>,
  leases: WeakMap<object, LeaseState>,
  registry: LeaseRegistry,
  stage: t.FsRooted.Stage,
  target: TargetState<'directory'>,
  signal: AbortSignal,
  input: PromotionInput,
): Promise<t.FsRooted.PromotionResult> {
  const operation = 'promote-stage';
  const state = stageState(stages, stage, operation);
  if (state.status !== 'active') throw failure(operation, 'invalid-state');

  let borrow: LeaseBorrow | undefined;
  let lock: LockState | undefined;
  let outcome: 'published' | 'occupied' | undefined;
  let prePublicationCommitted = false;
  let sealEvidence: t.FsRooted.SealApplied | undefined;
  let cleanupError: t.FsRooted.Failure | undefined;
  let pending: unknown;

  if (input.lease) {
    borrow = borrowLease(leases, input.lease, target, 'exclusive', operation);
  } else if (hasLocalLease(registry, target)) {
    throw failure(operation, 'invalid-lease');
  }

  try {
    if (!borrow) {
      lock = await acquireLock(io, root, target, {
        operation,
        mode: 'exclusive',
        wait: true,
        signal,
      });
      if (!lock) throw failure(operation, 'io-failure');
    }
    await validateActive(io, state, operation);
    checkCancelled(operation, signal);

    const existing = await observeTarget(io, root, target, operation, signal, true);
    if (existing) {
      outcome = 'occupied';
      try {
        await discardActive(io, state, operation);
      } catch (cause) {
        cleanupError = toFailure(operation, cause, false);
      }
    } else {
      checkCancelled(operation, signal);
      let appliedSeal: t.FsRooted.SealApplied | undefined;
      const stageTree = stageTreeAuthority(io, state, operation);
      if (input.seal) {
        const sealed = await sealTreeEntries(io, stageTree, operation, signal);
        if (sealed.kind === 'unsupported') throw failure(operation, 'unsupported');
        appliedSeal = sealed;
        prePublicationCommitted ||= sealed.changed;
      } else {
        const rootInfo = await lstatMaybe(io, state.content, operation);
        if (Num.Is.safeInt(rootInfo?.mode) && (rootInfo.mode & 0o222) === 0) {
          const inspected = await inspectTreeSeal(io, stageTree, operation, signal);
          if (inspected.kind === 'sealed') {
            appliedSeal = Object.freeze({ kind: 'applied', changed: false });
          }
        }
      }
      if (appliedSeal) {
        const movableChanged = await makeStageMovable(
          io,
          state,
          operation,
          prePublicationCommitted,
        );
        prePublicationCommitted ||= movableChanged;
      }
      checkCancelled(operation, signal, prePublicationCommitted);
      try {
        await io.rename(state.content, target.absolute);
      } catch (cause) {
        const published = await lstatMaybe(io, target.absolute, operation);
        const source = await lstatMaybe(io, state.content, operation);
        const moved = published?.isDirectory &&
          !published.isSymlink &&
          sameIdentity(state.contentIdentity, published) &&
          !source;
        if (moved) {
          cleanupError = toFailure(operation, cause, true);
        } else if (!source) {
          state.status = 'published';
          throw failure(operation, 'unsafe-filesystem', { cause, committed: true });
        } else if (cause instanceof Deno.errors.AlreadyExists) {
          const raced = await observeTarget(io, root, target, operation, signal, false);
          if (raced?.isDirectory && !raced.isSymlink) {
            outcome = 'occupied';
            try {
              await discardActive(io, state, operation);
            } catch (cleanupCause) {
              cleanupError = toFailure(operation, cleanupCause, prePublicationCommitted);
            }
          } else {
            throw failure(operation, 'unsafe-filesystem', {
              cause,
              committed: prePublicationCommitted,
            });
          }
        } else {
          throw ioFailure(operation, cause, prePublicationCommitted);
        }
      }

      if (!outcome) {
        // The target becomes visible when the stage directory is renamed into place.
        outcome = 'published';
        state.status = 'published';
        try {
          const published = await lstatMaybe(io, target.absolute, operation);
          if (
            !published?.isDirectory ||
            published.isSymlink ||
            !sameIdentity(state.contentIdentity, published)
          ) {
            throw failure(operation, 'unsafe-filesystem', { committed: true });
          }
          if (appliedSeal) {
            const sealed = await sealTreeEntries(
              io,
              targetTreeAuthority(io, root, target, state.contentIdentity, operation, signal),
              operation,
              signal,
            );
            if (sealed.kind === 'unsupported') {
              throw failure(operation, 'unsupported', { committed: true });
            }
            sealEvidence = Object.freeze({
              kind: 'applied',
              changed: prePublicationCommitted || sealed.changed,
            });
          }
          await cleanupPublished(io, state, operation);
          if (signal.aborted) {
            cleanupError ??= failure(operation, 'cancelled', {
              cause: signal.reason,
              committed: true,
            });
          }
        } catch (cause) {
          cleanupError ??= toFailure(operation, cause, true);
        }
      }
    }
  } catch (cause) {
    const operationFailure = toFailure(operation, cause, prePublicationCommitted);
    prePublicationCommitted ||= operationFailure.committed;
    pending = operationFailure;
    if (state.status === 'active') {
      try {
        await discardActive(io, state, operation);
      } catch (cleanupCause) {
        pending = toFailure(operation, cleanupCause, prePublicationCommitted);
      }
    }
  } finally {
    if (lock) {
      try {
        await releaseLock(io, root, lock, operation);
      } catch (cause) {
        if (outcome) {
          cleanupError ??= toFailure(
            operation,
            cause,
            outcome === 'published' || prePublicationCommitted,
          );
        } else pending ??= cause;
      }
    }
    if (borrow) releaseLeaseBorrow(borrow);
  }

  if (pending) throw toFailure(operation, pending, prePublicationCommitted);
  if (!outcome) throw failure(operation, 'io-failure');
  if (outcome === 'occupied') {
    return cleanupError
      ? Object.freeze({ kind: outcome, cleanupError })
      : Object.freeze({ kind: outcome });
  }
  return Object.freeze({
    kind: outcome,
    ...(sealEvidence ? { seal: sealEvidence } : {}),
    ...(cleanupError ? { cleanupError } : {}),
  });
}

export function stageState(
  stages: WeakMap<object, StageState>,
  stage: t.FsRooted.Stage,
  operation: t.FsRooted.Operation,
): StageState {
  const state = Is.object(stage) ? stages.get(stage) : undefined;
  if (!state) throw failure(operation, 'foreign-handle');
  return state;
}

export async function validateActive(
  io: Io,
  state: StageState,
  operation: t.FsRooted.Operation,
): Promise<void> {
  if (state.status !== 'active') throw failure(operation, 'invalid-state');
  const container = await lstatMaybe(io, state.container, operation);
  const content = await lstatMaybe(io, state.content, operation);
  if (
    !container?.isDirectory ||
    container.isSymlink ||
    !content?.isDirectory ||
    content.isSymlink ||
    !sameIdentity(state.containerIdentity, container) ||
    !sameIdentity(state.contentIdentity, content)
  ) {
    throw failure(operation, 'ownership-lost');
  }
  await readMarker(io, state, operation);
}

export function stageTreeAuthority(
  io: Io,
  state: StageState,
  operation: t.FsRooted.Operation,
): TreeAuthority {
  return {
    path: state.content,
    identity: state.contentIdentity,
    validate: () => validateActive(io, state, operation),
  };
}

async function makeStageMovable(
  io: Io,
  state: StageState,
  operation: t.FsRooted.Operation,
  committed: boolean,
): Promise<boolean> {
  try {
    await validateActive(io, state, operation);
  } catch (cause) {
    throw toFailure(operation, cause, committed);
  }
  const info = await lstatMaybe(io, state.content, operation);
  if (!info?.isDirectory || info.isSymlink || !sameIdentity(state.contentIdentity, info)) {
    throw failure(operation, 'ownership-lost', { committed });
  }
  if (!Num.Is.safeInt(info.mode) || info.mode < 0) {
    throw failure(operation, 'unsupported', { committed });
  }

  let changed = false;
  if ((info.mode & 0o200) === 0) {
    try {
      changed = await changeEntryMode(
        io,
        { path: state.content, kind: 'directory', identity: state.contentIdentity },
        info.mode,
        (info.mode & 0o7777) | 0o200,
        operation,
        committed,
      );
    } catch (cause) {
      throw toFailure(operation, cause, committed);
    }
  }

  const currentCommitted = committed || changed;
  try {
    await validateActive(io, state, operation);
  } catch (cause) {
    throw toFailure(operation, cause, currentCommitted);
  }
  const movable = await lstatMaybe(io, state.content, operation);
  if (
    !movable?.isDirectory ||
    movable.isSymlink ||
    !sameIdentity(state.contentIdentity, movable)
  ) {
    throw failure(operation, 'ownership-lost', { committed: currentCommitted });
  }
  if (!Num.Is.safeInt(movable.mode) || (movable.mode & 0o200) === 0) {
    throw failure(operation, 'unsupported', { committed: currentCommitted });
  }
  return changed;
}

function targetTreeAuthority(
  io: Io,
  root: RootState,
  target: TargetState<'directory'>,
  identity: Identity,
  operation: t.FsRooted.Operation,
  signal: AbortSignal,
): TreeAuthority {
  return {
    path: target.absolute,
    identity,
    validate: async (committed) => {
      const current = await observeTarget(io, root, target, operation, signal, false);
      if (!current?.isDirectory || current.isSymlink || !sameIdentity(identity, current)) {
        throw failure(operation, 'ownership-lost', { committed });
      }
    },
  };
}

async function writeMarker(
  io: Io,
  path: string,
  token: string,
  signal: AbortSignal,
): Promise<Identity> {
  const operation = 'create-stage';
  const bytes = new TextEncoder().encode(token);
  const file = await io.open(path, { read: true, write: true, createNew: true, mode: 0o600 });
  let identity: Identity | undefined;
  try {
    const opened = await file.stat();
    identity = identityRequired(opened, operation);
    let offset = 0;
    while (offset < bytes.byteLength) {
      checkCancelled(operation, signal);
      const written = await file.write(bytes.subarray(offset));
      if (!Is.number(written) || written <= 0 || written > bytes.byteLength - offset) {
        throw failure(operation, 'io-failure');
      }
      offset += written;
    }
    await file.sync();
    const final = await file.stat();
    if (final.size !== bytes.byteLength || !sameIdentity(identity, final)) {
      throw failure(operation, 'ownership-lost');
    }
    return identity;
  } finally {
    file.close();
  }
}

async function readMarker(
  io: Io,
  state: StageState,
  operation: t.FsRooted.Operation,
): Promise<void> {
  const pathInfo = await lstatMaybe(io, state.marker, operation);
  if (!pathInfo?.isFile || pathInfo.isSymlink || !sameIdentity(state.markerIdentity, pathInfo)) {
    throw failure(operation, 'ownership-lost');
  }

  const file = await io.open(state.marker, { read: true });
  try {
    const opened = await file.stat();
    if (!sameIdentity(state.markerIdentity, opened)) throw failure(operation, 'ownership-lost');
    const expected = new TextEncoder().encode(state.token);
    const buffer = new Uint8Array(expected.byteLength + 1);
    let offset = 0;
    while (offset < buffer.byteLength) {
      const read = await file.read(buffer.subarray(offset));
      if (read === null) break;
      if (!Is.number(read) || read <= 0) throw failure(operation, 'ownership-lost');
      offset += read;
    }
    if (offset !== expected.byteLength) throw failure(operation, 'ownership-lost');
    for (let index = 0; index < expected.byteLength; index++) {
      if (buffer[index] !== expected[index]) throw failure(operation, 'ownership-lost');
    }
  } finally {
    file.close();
  }
}

async function discardActive(
  io: Io,
  state: StageState,
  operation: t.FsRooted.Operation,
): Promise<void> {
  await validateActive(io, state, operation);
  state.status = 'discarding';
  await removeContainer(io, state.container, state.containerIdentity, operation);
  state.status = 'discarded';
}

async function cleanupPublished(
  io: Io,
  state: StageState,
  operation: t.FsRooted.Operation,
): Promise<void> {
  const container = await lstatMaybe(io, state.container, operation);
  if (!container) return;
  const content = await lstatMaybe(io, state.content, operation);
  if (!container.isDirectory || container.isSymlink || content) {
    throw failure(operation, 'ownership-lost', { committed: true });
  }
  if (!sameIdentity(state.containerIdentity, container)) {
    throw failure(operation, 'ownership-lost', { committed: true });
  }
  if (state.publishedCleanup === 'marker-required') {
    try {
      await readMarker(io, state, operation);
    } catch (cause) {
      throw toFailure(operation, cause, true);
    }
    state.publishedCleanup = 'authorized';
  }
  await removeContainer(io, state.container, state.containerIdentity, operation, true);
}

async function removeContainer(
  io: Io,
  path: string,
  identity: Identity,
  operation: t.FsRooted.Operation,
  committed = false,
): Promise<void> {
  const info = await lstatMaybe(io, path, operation);
  if (!info) return;
  if (!info.isDirectory || info.isSymlink || !sameIdentity(identity, info)) {
    throw failure(operation, 'ownership-lost', { committed });
  }
  const tree: TreeAuthority = {
    path,
    identity,
    validate: async (changed) => {
      const current = await lstatMaybe(io, path, operation);
      if (
        !current?.isDirectory ||
        current.isSymlink ||
        !sameIdentity(identity, current)
      ) {
        throw failure(operation, 'ownership-lost', { committed: changed });
      }
    },
  };
  await removeTreeEntries(io, tree, operation, CLEANUP_SIGNAL, committed);
}

function toFailure(
  operation: t.FsRooted.Operation,
  cause: unknown,
  committed: boolean,
): t.FsRooted.Failure {
  if (isFailure(cause)) {
    if (!committed || cause.committed) return cause;
    return failure(operation, cause.kind, { cause, committed: true });
  }
  return ioFailure(operation, cause, committed);
}
