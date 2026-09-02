import { StartGuiIntrinsic, type t } from '../common.ts';

import { isCapturedSignalAborted, observeCapturedAbort } from '../u.abort.ts';
import { createOwnedError } from '../u.error.ts';
import {
  captureFailure,
  type FailedBootState,
  failedBootState,
  listenerFailure,
} from '../u.failure.ts';
import {
  type ApplicationOwner,
  refuseIdentity,
  snapshotApplicationOwner,
} from '../u.identity/mod.ts';
import type { ReleaseLease } from '../u.materialize.ts';
import {
  createPromiseDeferred,
  enqueueMicrotask,
  isPromiseTransportReady,
  microtaskPromise,
  observePromiseTransport,
  PROMISE_TRANSPORT_ERROR,
  resolvedPromise,
} from '../u.promise.ts';
import type { BootStateOwner } from '../u.state.ts';
import { closeResources, closeResourcesWithoutPromiseTransport } from './u.cleanup.ts';
import {
  observeListener,
  retainUnobservableOperation,
  retainUnobservablePresentation,
} from './u.retention.ts';
import { snapshotKeyboardOwner, snapshotScreenOwner } from './u.snapshot.ts';
import type {
  CleanupEvidence,
  CleanupInput,
  KeyboardCleanupOwner,
  ListenerObservation,
  MaterializationCleanupIssue,
  MaterializationSettlementEvidence,
  ObservedReaction,
  OwnedCleanupIssue,
  ScreenCleanupOwner,
  StatusOwner,
  StopSource,
  Supervisor,
  TerminalEvent,
  WorkAdmission,
} from './t.ts';

const FAILURE_ABORT_REASON = 'start:gui.failure';
const TRUSTED_STOP_REASON = 'start:gui.trusted-control';
const EXTERNAL_STOP_REASON = 'start:gui.external-cancellation';
const UNOBSERVABLE_KEYBOARD_INVOCATION = StartGuiIntrinsic.freeze({
  kind: 'keyboard-invocation',
});
const UNOBSERVABLE_SCREEN_INVOCATION = StartGuiIntrinsic.freeze({
  kind: 'screen-invocation',
});

/** Own every resource participating in one GUI boot session. */
export function createSupervisor(input: {
  state: BootStateOwner;
  status: StatusOwner;
  stopLife: t.Abortable;
  workLife: t.Abortable;
}): Supervisor {
  if (!isPromiseTransportReady()) throw createOwnedError(PROMISE_TRANSPORT_ERROR);
  const terminal = createPromiseDeferred<TerminalEvent>();
  const foregroundReleased = createPromiseDeferred<void>();
  let terminalState: 'pending' | 'settled' = 'pending';
  let terminalValue: TerminalEvent | undefined;
  let committingTerminal: TerminalEvent | undefined;
  let pendingTerminal: TerminalEvent | undefined;
  let stopState: 'pending' | 'requested' = 'pending';
  let keyboard: KeyboardCleanupOwner | undefined;
  let keyboardState: 'empty' | 'set' = 'empty';
  let keyboardObservation: ListenerObservation | undefined;
  let screen: ScreenCleanupOwner | undefined;
  let application: ApplicationOwner | undefined;
  let applicationObservation: ListenerObservation | undefined;
  let applicationCloseFailed = false;
  let applicationClosePromise: Promise<void> | undefined;
  let lease: ReleaseLease | undefined;
  let closePromise: Promise<CleanupEvidence | undefined> | undefined;
  let invalidCleanup: CleanupEvidence | undefined;
  let invalidCleanupComplete = false;
  let statusObservation: ListenerObservation | undefined;
  let stateObserverFailed = false;
  const stateObserverErrors = StartGuiIntrinsic.createWeakSet<Error>();
  let materializationIssue: MaterializationCleanupIssue | undefined;
  let materializationEvidence: MaterializationSettlementEvidence | undefined;
  const unobservableIssues: OwnedCleanupIssue[] = [];
  let unobservableWork = false;

  const blocker = (): TerminalEvent | undefined =>
    terminalValue ?? committingTerminal ?? pendingTerminal;
  const abortWork = (reason: string) => {
    try {
      input.workLife.dispose(reason);
    } catch {
      // Abort delivery cannot be allowed to escape terminal arbitration.
    }
  };
  const settleTerminal = (event: TerminalEvent) => {
    if (terminalState === 'settled') return false;
    terminalState = 'settled';
    terminalValue = event;
    pendingTerminal = undefined;
    terminal.resolve(event);
    return true;
  };
  const requestApplicationClose = (reason: unknown): Promise<void> => {
    const active = application;
    if (!active) return resolvedPromise();
    if (applicationClosePromise) return applicationClosePromise;

    const closing = createPromiseDeferred<void>();
    applicationClosePromise = closing.promise;
    if (!isPromiseTransportReady()) {
      applicationCloseFailed = true;
      closing.resolve();
      return applicationClosePromise;
    }
    try {
      const observation = observePromiseTransport<void, void>(active.close(reason), {
        fulfilled() {
          closing.resolve();
        },
        rejected() {
          applicationCloseFailed = true;
          closing.resolve();
        },
      });
      if (observation.kind === 'invalid') {
        applicationCloseFailed = true;
        closing.resolve();
      }
    } catch {
      applicationCloseFailed = true;
      closing.resolve();
    }
    return applicationClosePromise;
  };
  const commitTerminal = (event: TerminalEvent) => {
    if (terminalState === 'settled' || committingTerminal) return false;
    committingTerminal = event;
    if (pendingTerminal === event) pendingTerminal = undefined;
    try {
      if (event.kind === 'failure' && input.state.current.kind !== 'stopping') {
        try {
          input.state.set(event.state);
        } catch {
          // State ownership changes before observers run; observer failure cannot block cleanup.
        }
      }
      if (!settleTerminal(event)) return false;
      if (event.kind === 'failure') {
        abortWork(FAILURE_ABORT_REASON);
        void requestApplicationClose(FAILURE_ABORT_REASON);
      }
      return true;
    } finally {
      committingTerminal = undefined;
    }
  };
  const enqueueTerminal = (event: TerminalEvent) => {
    if (terminalState === 'settled' || committingTerminal || pendingTerminal) return false;
    pendingTerminal = event;
    try {
      enqueueMicrotask(() => {
        if (terminalState === 'pending' && pendingTerminal === event) commitTerminal(event);
      });
    } catch {
      commitTerminal(event);
    }
    return true;
  };
  const latchStop = (source: StopSource) => {
    if (stopState === 'requested') return false;
    stopState = 'requested';
    foregroundReleased.resolve();
    if (terminalState === 'pending') {
      // Queue the stop candidate before abort delivery can settle lower cancellation work. Promise
      // reactions that were already queued before this request still retain their earlier position.
      enqueueTerminal(StartGuiIntrinsic.freeze({ kind: 'stop' as const, source }));
    }
    // A failure candidate already owns precedence and will publish its state before cancelling work.
    if (blocker()?.kind !== 'failure') {
      abortWork(source === 'trusted-control' ? TRUSTED_STOP_REASON : EXTERNAL_STOP_REASON);
    }
    return true;
  };
  const stop = (_reason: unknown) => {
    // Latch trusted intent before disposing the shared stop lifecycle, whose abort listener would
    // otherwise misclassify this same request as external cancellation.
    const accepted = latchStop('trusted-control');
    try {
      input.stopLife.dispose(TRUSTED_STOP_REASON);
    } catch {
      // The trusted stop request still owns termination if lifecycle delivery faults.
    }
    return accepted;
  };
  const fail = (error: Error, state: FailedBootState) => {
    // Immediate publication reserves a queue position and blocks work now. An already-queued direct
    // promise reaction may still run first and replace this not-yet-committed candidate.
    if (input.state.current.kind === 'stopping') return false;
    return enqueueTerminal(StartGuiIntrinsic.freeze({ kind: 'failure' as const, error, state }));
  };
  const beginObservedReaction = (): ObservedReaction =>
    StartGuiIntrinsic.freeze({ pending: pendingTerminal });
  const failObserved = (
    reaction: ObservedReaction,
    error: Error,
    state: FailedBootState,
  ) => {
    // A candidate present when this direct reaction began was queued later and may be displaced.
    // A different candidate was created reentrantly inside this reaction and retains precedence.
    if (
      terminalState === 'settled' || committingTerminal ||
      input.state.current.kind === 'stopping' ||
      pendingTerminal !== reaction.pending
    ) return false;
    pendingTerminal = undefined;
    return commitTerminal(StartGuiIntrinsic.freeze({ kind: 'failure' as const, error, state }));
  };
  const publishPromiseTransportFailure = (
    operation: Parameters<typeof failedBootState>[1],
    reaction?: ObservedReaction,
  ) => {
    const error = createOwnedError(PROMISE_TRANSPORT_ERROR);
    const state = failedBootState(undefined, operation);
    return reaction ? failObserved(reaction, error, state) : fail(error, state);
  };
  const publishScreenFailure = (cause: unknown) => {
    if (!isPromiseTransportReady()) {
      publishPromiseTransportFailure('screen');
      return;
    }
    const failure = captureFailure(cause, 'screen');
    fail(failure.error, failure.state);
  };
  const observeStatus = () => {
    try {
      statusObservation = observeListener(input.status.finished, (_failed, transportReady) => {
        const reaction = beginObservedReaction();
        if (input.state.current.kind === 'stopping') return;
        if (!transportReady) {
          publishPromiseTransportFailure('status-listener', reaction);
          return;
        }
        const failure = listenerFailure('status-listener');
        failObserved(reaction, failure.error, failure.state);
      });
    } catch {
      if (!isPromiseTransportReady()) {
        publishPromiseTransportFailure('status-listener');
      } else {
        const failure = listenerFailure('status-listener');
        fail(failure.error, failure.state);
      }
    }
  };
  const observeState = () => {
    const publishStateObserverFailure = () => {
      const error = createOwnedError('start:gui boot-state observer failed.');
      const state = failedBootState(undefined, 'screen');
      stateObserverFailed = true;
      StartGuiIntrinsic.weakSetAdd(stateObserverErrors, error);
      fail(error, state);
    };
    try {
      input.state.onObserverFailure(publishStateObserverFailure);
    } catch {
      publishStateObserverFailure();
    }
  };
  const recordUnobservableOperation = (
    resource: 'materialization' | 'application-host',
    transport: unknown,
  ) => {
    unobservableWork = true;
    if (resource === 'materialization') {
      materializationIssue ??= StartGuiIntrinsic.freeze({
        resource: 'materialization',
        state: 'unresolved',
        cleanup: 'pending',
      });
    } else if (
      !StartGuiIntrinsic.arraySome(
        unobservableIssues,
        (issue) => issue.resource === resource,
      )
    ) {
      StartGuiIntrinsic.arrayPush(
        unobservableIssues,
        StartGuiIntrinsic.freeze({ resource, state: 'unresolved' }),
      );
    }
    retainUnobservableOperation(resource, transport, lease);
  };
  const recordUnobservablePresentation = (
    resource: 'keyboard' | 'screen',
    value: unknown,
  ) => {
    if (
      !StartGuiIntrinsic.arraySome(
        unobservableIssues,
        (issue) => issue.resource === resource,
      )
    ) {
      StartGuiIntrinsic.arrayPush(
        unobservableIssues,
        StartGuiIntrinsic.freeze({ resource, state: 'unresolved' }),
      );
    }
    retainUnobservablePresentation(resource, value);
  };
  const cleanupInput = (): CleanupInput => ({
    status: input.status,
    statusObservation,
    stopLife: input.stopLife,
    workLife: input.workLife,
    get stateObserverFailed() {
      return stateObserverFailed && !(
        terminalValue?.kind === 'failure' &&
        StartGuiIntrinsic.weakSetHas(stateObserverErrors, terminalValue.error)
      );
    },
    materializationIssues: materializationIssue ? [materializationIssue] : [],
    unobservableIssues,
    get unobservableWork() {
      return unobservableWork;
    },
    get screen() {
      return screen;
    },
    get keyboard() {
      return keyboard;
    },
    get keyboardObservation() {
      return keyboardObservation;
    },
    closeApplication() {
      return requestApplicationClose('start:gui.finalized');
    },
    get application() {
      return application;
    },
    get applicationObservation() {
      return applicationObservation;
    },
    get applicationCloseFailed() {
      return applicationCloseFailed;
    },
    get lease() {
      return lease;
    },
  });

  if (isCapturedSignalAborted(input.stopLife.signal)) {
    latchStop('external-cancellation');
  } else {
    observeCapturedAbort(input.stopLife.signal, () => latchStop('external-cancellation'));
  }
  observeStatus();
  observeState();

  return StartGuiIntrinsic.freeze({
    signal: input.workLife.signal,
    terminal: terminal.promise,
    foregroundReleased: foregroundReleased.promise,
    get currentTerminal() {
      return terminalValue;
    },
    get currentBlocker() {
      return blocker();
    },
    get materializationEvidence() {
      return materializationEvidence;
    },
    checkpoint() {
      if (!isPromiseTransportReady()) throw createOwnedError(PROMISE_TRANSPORT_ERROR);
      return microtaskPromise(() => {
        const reaction = beginObservedReaction();
        if (!isPromiseTransportReady() && terminalState === 'pending') {
          const error = createOwnedError(PROMISE_TRANSPORT_ERROR);
          failObserved(reaction, error, failedBootState(undefined, 'authority'));
        }
        return blocker();
      });
    },
    admitWork<T>(action: () => T): WorkAdmission<T> {
      if (!isPromiseTransportReady()) throw createOwnedError(PROMISE_TRANSPORT_ERROR);
      const blocked = blocker();
      if (blocked) return StartGuiIntrinsic.freeze({ kind: 'blocked', event: blocked });
      return StartGuiIntrinsic.freeze({ kind: 'admitted', value: action() });
    },
    requestStop: stop,
    publishFailure: fail,
    beginObservedReaction,
    publishObservedFailure: failObserved,
    publishScreenFailure,
    recordMaterialization(result) {
      if (result.kind === 'generation') {
        if (result.cleanup !== 'pending' || materializationIssue) return;
        materializationIssue = StartGuiIntrinsic.freeze({
          resource: 'materialization',
          state: 'unresolved',
          cleanup: result.cleanup,
        });
        return;
      }
      if (result.cleanup !== 'pending' && result.publication === undefined) return;
      materializationEvidence ??= StartGuiIntrinsic.freeze({
        kind: 'materialization',
        stage: result.stage,
        reason: result.reason,
        cleanup: result.cleanup,
        ...(result.publication ? { publication: result.publication } : {}),
      });
      if (result.cleanup !== 'pending' || materializationIssue) return;
      materializationIssue = StartGuiIntrinsic.freeze({
        resource: 'materialization',
        state: 'unresolved',
        stage: result.stage,
        reason: result.reason,
        cleanup: result.cleanup,
        ...(result.publication ? { publication: result.publication } : {}),
      });
    },
    recordUnobservableOperation,
    recordUnobservableControl(resource) {
      recordUnobservablePresentation(
        resource,
        resource === 'keyboard' ? UNOBSERVABLE_KEYBOARD_INVOCATION : UNOBSERVABLE_SCREEN_INVOCATION,
      );
    },
    setKeyboard(next) {
      if (keyboardState === 'set') throw createOwnedError('start:gui keyboard already bound.');
      keyboardState = 'set';
      const snapshot = snapshotKeyboardOwner(next);
      if (snapshot.owner) keyboard = snapshot.owner;
      if (snapshot.kind === 'invalid') {
        if (!snapshot.owner) recordUnobservablePresentation('keyboard', next);
        throw createOwnedError('start:gui keyboard invalid.');
      }

      try {
        keyboardObservation = observeListener(
          snapshot.owner.finished,
          (_failed, transportReady) => {
            const reaction = beginObservedReaction();
            // Only the explicit onQuit/onKey callbacks establish trusted user intent. Any otherwise
            // terminal keyboard owner means control authority disappeared unexpectedly. Release an
            // earlier failure foreground as well: this owner can no longer deliver its quit callback.
            foregroundReleased.resolve();
            if (!transportReady) {
              publishPromiseTransportFailure('controls', reaction);
              return;
            }
            const error = createOwnedError('start:gui keyboard lifecycle failed.');
            failObserved(reaction, error, failedBootState(undefined, 'controls'));
          },
        );
      } catch {
        foregroundReleased.resolve();
        if (!isPromiseTransportReady()) {
          publishPromiseTransportFailure('controls');
        } else {
          const error = createOwnedError('start:gui keyboard lifecycle failed.');
          fail(error, failedBootState(undefined, 'controls'));
        }
      }
    },
    setScreen(next) {
      if (screen) throw createOwnedError('start:gui screen already created.');
      const snapshot = snapshotScreenOwner(next);
      if (snapshot.owner) screen = snapshot.owner;
      if (snapshot.kind === 'invalid') {
        if (!snapshot.owner) recordUnobservablePresentation('screen', next);
        throw createOwnedError('start:gui screen invalid.');
      }

      const owner = snapshot.owner;
      const publishObservedScreenFailure = (cause: unknown) => {
        const reaction = beginObservedReaction();
        if (!isPromiseTransportReady()) {
          publishPromiseTransportFailure('screen', reaction);
          return;
        }
        const failure = captureFailure(cause, 'screen');
        failObserved(reaction, failure.error, failure.state);
      };
      try {
        const observation = observePromiseTransport<never, void>(owner.failure, {
          fulfilled() {
            publishObservedScreenFailure(undefined);
          },
          rejected: publishObservedScreenFailure,
        });
        if (observation.kind === 'invalid') {
          if (!isPromiseTransportReady()) publishPromiseTransportFailure('screen');
          else publishScreenFailure(undefined);
        }
      } catch {
        if (!isPromiseTransportReady()) publishPromiseTransportFailure('screen');
        else publishScreenFailure(undefined);
      }
      return owner;
    },
    setApplication(next, expected) {
      if (application) {
        throw createOwnedError('start:gui application host already started.');
      }
      const reaction = beginObservedReaction();
      const snapshot = snapshotApplicationOwner(next, expected);
      if (!snapshot.owner) {
        recordUnobservableOperation('application-host', next);
        throw createOwnedError('start:gui application host invalid.');
      }
      application = snapshot.owner;
      if (snapshot.finished) {
        try {
          applicationObservation = observeListener(
            snapshot.finished,
            (_failed, transportReady) => {
              const listenerReaction = beginObservedReaction();
              if (input.state.current.kind === 'stopping' || applicationClosePromise) return;
              if (!transportReady) {
                publishPromiseTransportFailure('application-listener', listenerReaction);
                return;
              }
              const failure = listenerFailure('application-listener');
              failObserved(listenerReaction, failure.error, failure.state);
            },
          );
        } catch {
          if (!isPromiseTransportReady()) {
            publishPromiseTransportFailure('application-listener', reaction);
          } else {
            const failure = listenerFailure('application-listener');
            failObserved(reaction, failure.error, failure.state);
          }
        }
      }
      if (isCapturedSignalAborted(input.workLife.signal)) {
        void requestApplicationClose('start:gui.cancelled-before-application-admission');
      }
      if (snapshot.kind === 'invalid') {
        throw createOwnedError('start:gui application host invalid.');
      }
      if (snapshot.kind === 'refused') refuseIdentity(expected.diagnostics);
      return snapshot.owner;
    },
    setLease(next) {
      if (lease) throw createOwnedError('start:gui generation lease already acquired.');
      lease = next;
    },
    close() {
      if (!isPromiseTransportReady()) throw createOwnedError(PROMISE_TRANSPORT_ERROR);
      closePromise ??= closeResources(cleanupInput());
      return closePromise;
    },
    closeInvalidTransport() {
      if (!invalidCleanupComplete) {
        invalidCleanupComplete = true;
        invalidCleanup = closeResourcesWithoutPromiseTransport(cleanupInput());
      }
      return invalidCleanup;
    },
  });
}
