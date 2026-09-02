import { type Cli, Is, StartGuiIntrinsic, type t } from '../common.ts';

import { createOwnedError } from '../u.error.ts';
import { descriptorMethod, descriptorValue, snapshotResizeAfter } from './u.input.ts';
import type { PartialResizeFailure } from './t.ts';

const apply = Reflect.apply;
const PARTIAL_RESIZE_FAILURES = StartGuiIntrinsic.createWeakMap<
  object,
  PartialResizeFailure
>();

/**
 * Observe terminal resize events with an explicit event-source dependency.
 */
export function observeResizeWith(
  createEvents: typeof Cli.Screen.events,
  handler: (size: unknown) => void,
): () => void {
  let events: unknown;
  try {
    events = createEvents();
  } catch {
    throw partialResizeFailure(unresolvedCleanup(createEvents));
  }

  const disposeEvents = descriptorMethod(events, 'dispose');
  const releaseEvents = disposeEvents
    ? () => apply(disposeEvents, events, [])
    : unresolvedCleanup(events);
  if (!disposeEvents) throw partialResizeFailure(retryableCleanup([releaseEvents]));

  const resize = descriptorValue(events, 'resize$');
  const subscribe = descriptorMethod(resize, 'subscribe');
  if (resize === undefined || !subscribe) {
    failResizeAcquisition(retryableCleanup([releaseEvents]));
  }

  let subscription: unknown;
  try {
    subscription = apply(subscribe, resize, [
      (event: t.Cli.Screen.SizeChanged) => handler(snapshotResizeAfter(event)),
    ]);
  } catch {
    failResizeAcquisition(retryableCleanup([releaseEvents]));
  }

  const unsubscribe = descriptorMethod(subscription, 'unsubscribe');
  if (!unsubscribe) failResizeAcquisition(retryableCleanup([releaseEvents]));
  return retryableCleanup([
    () => apply(unsubscribe, subscription, []),
    releaseEvents,
  ]);
}

export function takePartialResizeFailure(cause: unknown): PartialResizeFailure | undefined {
  if (!Is.object(cause)) return;
  const failure = StartGuiIntrinsic.weakMapGet(PARTIAL_RESIZE_FAILURES, cause);
  if (failure) StartGuiIntrinsic.weakMapDelete(PARTIAL_RESIZE_FAILURES, cause);
  return failure;
}

export function throwCleanupFailures(failures: readonly unknown[]): void {
  if (failures.length > 0) throw createOwnedError('start:gui screen cleanup failed.');
}

function partialResizeFailure(release: () => void): Error {
  const error = createOwnedError('start:gui screen resize acquisition failed.');
  StartGuiIntrinsic.weakMapSet(PARTIAL_RESIZE_FAILURES, error, { release });
  return error;
}

function failResizeAcquisition(release: () => void): never {
  try {
    release();
  } catch {
    throw partialResizeFailure(release);
  }
  throw createOwnedError('start:gui screen resize acquisition failed.');
}

function unresolvedCleanup(owner: unknown): () => void {
  return () => {
    void owner;
    throw createOwnedError('start:gui screen cleanup failed.');
  };
}

function retryableCleanup(actions: readonly (() => void)[]): () => void {
  const pending: ((() => void) | undefined)[] = StartGuiIntrinsic.arraySlice(actions);
  return () => {
    const failures: unknown[] = [];
    // Positional access clears only actions whose exact cleanup attempt completed.
    for (let index = 0; index < pending.length; index++) {
      const action = pending[index];
      if (!action) continue;
      try {
        action();
        pending[index] = undefined;
      } catch (cause) {
        StartGuiIntrinsic.arrayPush(failures, cause);
      }
    }
    throwCleanupFailures(failures);
  };
}
