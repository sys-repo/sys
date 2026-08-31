import { Is, StartGuiIntrinsic, type t } from './common.ts';

import { isCapturedSignalAborted, observeCapturedAbort } from './u.abort.ts';
import {
  type AdmittedApplicationOwner,
  type AdmittedMaterialization,
  type ApplicationIdentityExpectation,
  type ApplicationOwner,
  refuseIdentity,
  snapshotApplicationOwner,
} from './u.identity.ts';
import type { Started } from './u.deps.ts';
import { createOwnedError, ownedError } from './u.error.ts';
import {
  captureFailure,
  type FailedBootState,
  failedBootState,
  listenerFailure,
} from './u.failure.ts';
import {
  createPromiseDeferred,
  enqueueMicrotask,
  isPromiseTransport,
  isPromiseTransportReady,
  microtaskPromise,
  observePromiseTransport,
  PROMISE_TRANSPORT_ERROR,
  resolvedPromise,
} from './u.promise.ts';
import type { ReleaseLease } from './u.materialize.ts';
import type { BootStateOwner } from './u.state.ts';
import type { StartGuiScreenInstance } from './u.screen.ts';
import { captureUrl } from './u.url.ts';

export type PresentationEvidence = Readonly<{
  kind: 'browser-open-failed';
  url: t.StringUrl;
}>;

type OwnedCleanupIssue = Readonly<{
  resource:
    | 'screen'
    | 'keyboard'
    | 'state-observer'
    | 'application-host'
    | 'application-listener'
    | 'generation-lease'
    | 'status-listener';
  state: 'failed' | 'unresolved';
}>;

type MaterializationCleanupIssue = Readonly<{
  resource: 'materialization';
  state: 'unresolved';
  cleanup: 'pending';
  stage?: t.Dist.FailureStage;
  reason?: t.Dist.FailureReason;
  publication?: t.Dist.FailedPublication;
}>;

type MaterializationSettlementEvidence = Readonly<{
  kind: 'materialization';
  stage: t.Dist.FailureStage;
  reason: t.Dist.FailureReason;
  cleanup: t.Dist.Cleanup;
  publication?: t.Dist.FailedPublication;
}>;

type CleanupIssue = OwnedCleanupIssue | MaterializationCleanupIssue;

export type CleanupEvidence = Readonly<{
  kind: 'cleanup-failed';
  issues: readonly CleanupIssue[];
}>;

export type StopSource = 'trusted-control' | 'external-cancellation';

export type TerminalEvent =
  | Readonly<{ kind: 'stop'; source: StopSource }>
  | Readonly<{ kind: 'failure'; error: Error; state: FailedBootState }>;

export type WorkAdmission<T> =
  | Readonly<{ kind: 'admitted'; value: T }>
  | Readonly<{ kind: 'blocked'; event: TerminalEvent }>;

export type ObservedReaction = Readonly<{ pending: TerminalEvent | undefined }>;

export type StatusCleanupOwner = Readonly<{
  finished?: Promise<void>;
  close(reason?: unknown): Promise<void>;
}>;

export type StatusOwner =
  & StatusCleanupOwner
  & Readonly<{
    url: t.StringUrl;
    finished: Promise<void>;
  }>;

export type StatusOwnerSnapshot =
  | Readonly<{ kind: 'admitted'; owner: StatusOwner }>
  | Readonly<{ kind: 'invalid'; owner?: StatusCleanupOwner }>;

type KeyboardCleanupOwner = Readonly<{ dispose(): void }>;
type KeyboardOwner = KeyboardCleanupOwner & Readonly<{ finished: Promise<void> }>;
type ScreenCleanupOwner = Readonly<{ dispose(): void }>;
type ScreenOwner = ScreenCleanupOwner & StartGuiScreenInstance;

export type Supervisor = {
  /** Work cancellation shared by acquisition and the application host. */
  readonly signal: AbortSignal;
  /** First trusted stop, external cancellation, or internal failure observed by this session. */
  readonly terminal: Promise<TerminalEvent>;
  /** Settles when stop is requested or keyboard loss makes foreground interaction impossible. */
  readonly foregroundReleased: Promise<void>;
  /** The final terminal winner, when already settled. */
  readonly currentTerminal: TerminalEvent | undefined;
  /** The final winner or an immediate pending-stop latch that prohibits new work. */
  readonly currentBlocker: TerminalEvent | undefined;
  /** Safe lower settlement retained only when another terminal event kept precedence. */
  readonly materializationEvidence: MaterializationSettlementEvidence | undefined;
  /** Allow direct promise observers to run before the next atomic work admission. */
  checkpoint(): Promise<TerminalEvent | undefined>;
  /** Synchronously admit an unsafe action only while no terminal event blocks new work. */
  admitWork<T>(action: () => T): WorkAdmission<T>;
  /** Request trusted stop and report whether this call owns the first stop latch. */
  requestStop(reason: unknown): boolean;
  /** Publish a synchronous failure; a preceding pending stop retains precedence. */
  publishFailure(error: Error, state: FailedBootState): boolean;
  /** Snapshot the pending candidate before one direct reaction invokes any admitted callback. */
  beginObservedReaction(): ObservedReaction;
  /** Publish from a direct reaction without displacing a candidate created reentrantly within it. */
  publishObservedFailure(
    reaction: ObservedReaction,
    error: Error,
    state: FailedBootState,
  ): boolean;
  /** Publish directly from the package-controlled screen failure source. */
  publishScreenFailure(cause: unknown): void;
  recordMaterialization(result: AdmittedMaterialization): void;
  recordUnobservableOperation(
    resource: 'materialization' | 'application-host',
    transport: unknown,
  ): void;
  recordUnobservableControl(resource: 'keyboard' | 'screen'): void;
  setKeyboard(keyboard: unknown): void;
  setScreen(screen: unknown): ScreenOwner;
  setApplication(
    started: Started,
    expected: ApplicationIdentityExpectation,
  ): AdmittedApplicationOwner;
  setLease(lease: ReleaseLease): void;
  close(): Promise<CleanupEvidence | undefined>;
  /** Perform every synchronous cleanup step when Promise transport is already unavailable. */
  closeInvalidTransport(): CleanupEvidence | undefined;
};

type ListenerObservation = {
  readonly settled: boolean;
  readonly failed: boolean;
  /** Settles only after the owned listener reaction and settlement callbacks terminate. */
  readonly completion: Promise<void>;
  onSettled(listener: () => void): void;
};

type RetainedOwnership =
  | {
    readonly kind: 'application';
    readonly application: ApplicationOwner;
    readonly observation: ListenerObservation;
    readonly lease?: ReleaseLease;
  }
  | {
    readonly kind: 'application-unobserved';
    readonly application: ApplicationOwner;
    readonly lease?: ReleaseLease;
  }
  | {
    readonly kind: 'status';
    readonly status: StatusCleanupOwner;
    readonly observation?: ListenerObservation;
  }
  | {
    readonly kind: 'status-operation-unobserved';
    readonly transport: unknown;
  }
  | {
    readonly kind: 'lease';
    readonly lease: ReleaseLease;
  }
  | {
    readonly kind: 'operation-unobserved';
    readonly resource: 'materialization' | 'application-host';
    readonly transport: unknown;
    readonly lease?: ReleaseLease;
  }
  | {
    readonly kind: 'keyboard';
    readonly keyboard: KeyboardCleanupOwner;
    readonly observation?: ListenerObservation;
  }
  | {
    readonly kind: 'screen';
    readonly screen: ScreenCleanupOwner;
  }
  | {
    readonly kind: 'presentation-unobserved';
    readonly resource: 'keyboard' | 'screen';
    readonly value: unknown;
  };

/** Faulted ownership remains strongly rooted until absence is actually proven. */
const RETAINED_OWNERSHIP = StartGuiIntrinsic.createSet<RetainedOwnership>();
const defineProperty = Object.defineProperty;
const freeze = Object.freeze;
const getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
const apply = Reflect.apply;
const FAILURE_ABORT_REASON = 'start:gui.failure';
const TRUSTED_STOP_REASON = 'start:gui.trusted-control';
const EXTERNAL_STOP_REASON = 'start:gui.external-cancellation';
const UNOBSERVABLE_KEYBOARD_INVOCATION = freeze({ kind: 'keyboard-invocation' });
const UNOBSERVABLE_SCREEN_INVOCATION = freeze({ kind: 'screen-invocation' });

type KeyboardOwnerSnapshot =
  | Readonly<{ kind: 'admitted'; owner: KeyboardOwner }>
  | Readonly<{ kind: 'invalid'; owner?: KeyboardCleanupOwner }>;

type ScreenOwnerSnapshot =
  | Readonly<{ kind: 'admitted'; owner: ScreenOwner }>
  | Readonly<{ kind: 'invalid'; owner?: ScreenCleanupOwner }>;

/** Copy one narrow status owner without retaining its raw listener facade. */
export function snapshotStatusOwner(input: unknown): StatusOwnerSnapshot {
  if (!Is.object(input) || Is.Native.proxy(input)) return INVALID_STATUS_OWNER;
  const closeProperty = directData(input, 'close');
  if (
    !closeProperty.ok || !Is.func(closeProperty.value) || Is.Native.proxy(closeProperty.value)
  ) return INVALID_STATUS_OWNER;

  const closeMethod = closeProperty.value;
  const finishedProperty = directData(input, 'finished');
  const finished = finishedProperty.ok && isPromiseTransport(finishedProperty.value)
    ? finishedProperty.value as Promise<void>
    : undefined;
  const cleanupOwner = freeze({
    ...(finished ? { finished } : {}),
    close(reason?: unknown) {
      return apply(closeMethod, undefined, [reason]) as Promise<void>;
    },
  });
  const urlProperty = directData(input, 'url');
  if (!finished || !urlProperty.ok || !isStatusUrl(urlProperty.value)) {
    return freeze({ kind: 'invalid', owner: cleanupOwner });
  }
  return freeze({
    kind: 'admitted',
    owner: freeze({ ...cleanupOwner, finished, url: urlProperty.value }),
  });
}

function snapshotKeyboardOwner(input: unknown): KeyboardOwnerSnapshot {
  if (!Is.object(input) || Is.Native.proxy(input)) return INVALID_KEYBOARD_OWNER;
  const disposeProperty = directData(input, 'dispose');
  if (
    !disposeProperty.ok || !Is.func(disposeProperty.value) || Is.Native.proxy(disposeProperty.value)
  ) return INVALID_KEYBOARD_OWNER;

  const disposeMethod = disposeProperty.value;
  const cleanupOwner: KeyboardCleanupOwner = freeze({
    dispose() {
      apply(disposeMethod, undefined, []);
    },
  });
  const finishedProperty = directData(input, 'finished');
  if (!finishedProperty.ok || !isPromiseTransport(finishedProperty.value)) {
    return freeze({ kind: 'invalid', owner: cleanupOwner });
  }
  return freeze({
    kind: 'admitted',
    owner: freeze({ ...cleanupOwner, finished: finishedProperty.value as Promise<void> }),
  });
}

function snapshotScreenOwner(input: unknown): ScreenOwnerSnapshot {
  if (!Is.object(input) || Is.Native.proxy(input)) return INVALID_SCREEN_OWNER;
  const disposeProperty = directData(input, 'dispose');
  if (
    !disposeProperty.ok || !Is.func(disposeProperty.value) || Is.Native.proxy(disposeProperty.value)
  ) return INVALID_SCREEN_OWNER;

  const disposeMethod = disposeProperty.value;
  const cleanupOwner: ScreenCleanupOwner = freeze({
    dispose() {
      apply(disposeMethod, undefined, []);
    },
  });
  const kind = directData(input, 'kind');
  const failure = directData(input, 'failure');
  const redraw = directData(input, 'redraw');
  const warnOpen = directData(input, 'warnOpen');
  if (
    !kind.ok || (kind.value !== 'acquired' && kind.value !== 'failed' &&
      kind.value !== 'unavailable') ||
    !failure.ok || !isPromiseTransport(failure.value) ||
    !redraw.ok || !Is.func(redraw.value) || Is.Native.proxy(redraw.value) ||
    !warnOpen.ok || !Is.func(warnOpen.value) || Is.Native.proxy(warnOpen.value)
  ) return freeze({ kind: 'invalid', owner: cleanupOwner });

  const redrawMethod = redraw.value;
  const warnOpenMethod = warnOpen.value;
  return freeze({
    kind: 'admitted',
    owner: freeze({
      ...cleanupOwner,
      kind: kind.value,
      failure: failure.value as Promise<never>,
      redraw() {
        apply(redrawMethod, undefined, []);
      },
      warnOpen() {
        apply(warnOpenMethod, undefined, []);
      },
    }),
  });
}

function directData(
  input: object,
  key: PropertyKey,
): Readonly<{ ok: true; value: unknown }> | Readonly<{ ok: false }> {
  try {
    const descriptor = getOwnPropertyDescriptor(input, key);
    return descriptor && 'value' in descriptor
      ? freeze({ ok: true as const, value: descriptor.value })
      : DATA_UNAVAILABLE;
  } catch {
    return DATA_UNAVAILABLE;
  }
}

function isStatusUrl(input: unknown): input is t.StringUrl {
  if (!Is.string(input) || input.length > 4_096) return false;
  const url = captureUrl(input);
  return url !== undefined && url.protocol === 'http:' && url.hostname === '127.0.0.1' &&
    url.port.length > 0 && url.port !== '0' && !url.username && !url.password && !url.search &&
    !url.hash &&
    isStatusCapabilityPath(url.pathname) && `${url.origin}${url.pathname}` === input;
}

function isStatusCapabilityPath(input: string): boolean {
  if (
    input.length < 26 || input.length > 129 ||
    StartGuiIntrinsic.stringCharCodeAt(input, 0) !== 0x2f
  ) return false;
  for (let index = 1; index < input.length; index += 1) {
    const code = StartGuiIntrinsic.stringCharCodeAt(input, index);
    const digit = code >= 0x30 && code <= 0x39;
    const lower = code >= 0x61 && code <= 0x7a;
    if (!digit && !lower) return false;
  }
  return true;
}

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
      enqueueTerminal(freeze({ kind: 'stop' as const, source }));
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
    return enqueueTerminal(freeze({ kind: 'failure' as const, error, state }));
  };
  const beginObservedReaction = (): ObservedReaction => freeze({ pending: pendingTerminal });
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
    return commitTerminal(freeze({ kind: 'failure' as const, error, state }));
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
      materializationIssue ??= freeze({
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
      StartGuiIntrinsic.arrayPush(unobservableIssues, freeze({ resource, state: 'unresolved' }));
    }
    StartGuiIntrinsic.setAdd(RETAINED_OWNERSHIP, {
      kind: 'operation-unobserved',
      resource,
      transport,
      lease,
    });
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
      StartGuiIntrinsic.arrayPush(unobservableIssues, freeze({ resource, state: 'unresolved' }));
    }
    StartGuiIntrinsic.setAdd(RETAINED_OWNERSHIP, {
      kind: 'presentation-unobserved',
      resource,
      value,
    });
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

  return freeze({
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
      if (blocked) return freeze({ kind: 'blocked', event: blocked });
      return freeze({ kind: 'admitted', value: action() });
    },
    requestStop: stop,
    publishFailure: fail,
    beginObservedReaction,
    publishObservedFailure: failObserved,
    publishScreenFailure,
    recordMaterialization(result) {
      if (result.kind === 'generation') {
        if (result.cleanup !== 'pending' || materializationIssue) return;
        materializationIssue = freeze({
          resource: 'materialization',
          state: 'unresolved',
          cleanup: result.cleanup,
        });
        return;
      }
      if (result.cleanup !== 'pending' && result.publication === undefined) return;
      materializationEvidence ??= freeze({
        kind: 'materialization',
        stage: result.stage,
        reason: result.reason,
        cleanup: result.cleanup,
        ...(result.publication ? { publication: result.publication } : {}),
      });
      if (result.cleanup !== 'pending' || materializationIssue) return;
      materializationIssue = freeze({
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

/** Retain a status owner when startup cannot safely establish listener observation. */
export function retainUnsupervisedStatus(
  status: StatusCleanupOwner,
  reason?: unknown,
): void {
  let observation: ListenerObservation | undefined;
  if (status.finished) {
    try {
      observation = observeListener(status.finished, () => undefined);
    } catch {
      // The narrow close owner remains retained when completion cannot be admitted.
    }
  }
  retainStatus(status, observation);
  if (reason === undefined || !isPromiseTransportReady()) return;
  try {
    observePromiseTransport<void, void>(status.close(reason), {
      fulfilled() {},
      rejected() {},
    });
  } catch {
    // Retained ownership remains the truthful fallback.
  }
}

/** Retain an invoked status operation whose completion transport cannot be admitted. */
export function retainUnobservableStatusOperation(transport: unknown): void {
  StartGuiIntrinsic.setAdd(RETAINED_OWNERSHIP, {
    kind: 'status-operation-unobserved',
    transport,
  });
}

/** Return the final primary error with typed secondary evidence, if any. */
export function finalError(input: {
  primary?: unknown;
  cleanup?: CleanupEvidence;
  presentation?: PresentationEvidence;
  materialization?: MaterializationSettlementEvidence;
}): Error | undefined {
  if (
    input.primary === undefined && input.cleanup === undefined &&
    input.materialization === undefined
  ) return;
  const hasPrimary = input.primary !== undefined;
  const primary = hasPrimary
    ? ownedError(input.primary, 'start:gui failed.')
    : input.cleanup
    ? cleanupError(input.cleanup)
    : createOwnedError('start:gui retained secondary materialization evidence.');
  const secondary: Readonly<{ key: string; value: unknown }>[] = [];
  if (hasPrimary && input.cleanup) {
    StartGuiIntrinsic.arrayPush(secondary, { key: 'cleanup', value: input.cleanup });
  }
  if (input.presentation) {
    StartGuiIntrinsic.arrayPush(secondary, { key: 'presentation', value: input.presentation });
  }
  if (input.materialization) {
    StartGuiIntrinsic.arrayPush(secondary, {
      key: 'materialization',
      value: input.materialization,
    });
  }
  if (secondary.length === 0) return primary;

  try {
    for (let index = 0; index < secondary.length; index += 1) {
      const entry = secondary[index];
      defineProperty(primary, entry.key, {
        configurable: true,
        enumerable: true,
        value: entry.value,
      });
    }
    return primary;
  } catch {
    const error = createOwnedError(errorMessage(primary));
    defineProperty(error, 'primary', { enumerable: true, value: primary });
    for (let index = 0; index < secondary.length; index += 1) {
      const entry = secondary[index];
      defineProperty(error, entry.key, { enumerable: true, value: entry.value });
    }
    return error;
  }
}

type CleanupInput = {
  readonly status: StatusOwner;
  readonly statusObservation?: ListenerObservation;
  readonly stopLife: t.Abortable;
  readonly workLife: t.Abortable;
  readonly stateObserverFailed: boolean;
  readonly materializationIssues: readonly MaterializationCleanupIssue[];
  readonly unobservableIssues: readonly OwnedCleanupIssue[];
  readonly unobservableWork: boolean;
  readonly screen?: ScreenCleanupOwner;
  readonly keyboard?: KeyboardCleanupOwner;
  readonly keyboardObservation?: ListenerObservation;
  readonly closeApplication: () => Promise<void>;
  readonly application?: ApplicationOwner;
  readonly applicationObservation?: ListenerObservation;
  readonly applicationCloseFailed: boolean;
  readonly lease?: ReleaseLease;
};

type CleanupProgress = Readonly<{
  presentationIssues: CleanupIssue[];
  issues: CleanupIssue[];
  screenDisposal: DisposalResult;
  keyboardDisposal: DisposalResult;
}>;

async function closeResources(input: CleanupInput): Promise<CleanupEvidence | undefined> {
  // Yield before any lower call so the caller owns this completion transport in the admission turn.
  await microtaskPromise(() => undefined);
  if (!isPromiseTransportReady()) return closeResourcesWithoutPromiseTransport(input);

  const progress = beginSynchronousCleanup(input);
  if (!isPromiseTransportReady()) return completeWithoutPromiseTransport(input, progress);

  let closingApplication:
    | Readonly<{ kind: 'observed'; promise: Promise<void> }>
    | Readonly<{ kind: 'invalid' }>;
  try {
    closingApplication = observePromiseTransport<void, void>(input.closeApplication(), {
      fulfilled() {},
      rejected() {},
    });
  } catch {
    closingApplication = freeze({ kind: 'invalid' });
  }
  if (closingApplication.kind === 'invalid') {
    return completeWithoutPromiseTransport(input, progress);
  }
  await closingApplication.promise;

  const initialApplicationIssue = input.application
    ? classifyListenerClose(
      'application-listener',
      input.applicationObservation,
      input.applicationCloseFailed,
    )
    : undefined;
  const applicationInitiallyUnresolved = initialApplicationIssue?.state === 'unresolved';
  const leaseBlocked = applicationInitiallyUnresolved || input.unobservableWork;
  if (!isPromiseTransportReady()) {
    return completeWithoutPromiseTransport(input, progress);
  }

  const leaseClosing = leaseBlocked
    ? resolvedPromise(
      input.lease
        ? freeze({
          resource: 'generation-lease' as const,
          state: 'unresolved' as const,
        })
        : undefined,
    )
    : closeLease(input.lease);
  if (!isPromiseTransportReady()) {
    return completeWithoutPromiseTransport(input, progress);
  }

  // Status shutdown starts independently even when lease release remains unresolved.
  const statusClosing = closeStatus(input.status, input.statusObservation);
  const closing = joinCleanup(leaseClosing, statusClosing);
  if (!closing) return completeWithoutPromiseTransport(input, progress);
  const closed = await closing;
  const statusIssue = closed.status;

  const applicationIssue = input.application
    ? classifyListenerClose(
      'application-listener',
      input.applicationObservation,
      input.applicationCloseFailed,
    )
    : undefined;
  if (applicationIssue) StartGuiIntrinsic.arrayPush(progress.issues, applicationIssue);

  let leaseIssue = closed.lease;
  if (
    applicationInitiallyUnresolved && !input.unobservableWork &&
    applicationIssue?.state !== 'unresolved' && input.lease
  ) {
    if (!isPromiseTransportReady()) {
      if (statusIssue) StartGuiIntrinsic.arrayPush(progress.issues, statusIssue);
      return completeWithoutPromiseTransport(input, progress, applicationIssue);
    }
    const releaseAfterListener = joinCleanup(
      closeLease(input.lease),
      resolvedPromise(undefined),
    );
    if (!releaseAfterListener) {
      if (statusIssue) StartGuiIntrinsic.arrayPush(progress.issues, statusIssue);
      return completeWithoutPromiseTransport(input, progress, applicationIssue);
    }
    leaseIssue = (await releaseAfterListener).lease;
  }
  if (applicationIssue?.state === 'unresolved') retainApplicationOwnership(input);
  if (
    input.unobservableWork && input.lease && applicationIssue?.state !== 'unresolved'
  ) retainLease(input.lease);
  if (leaseIssue) StartGuiIntrinsic.arrayPush(progress.issues, leaseIssue);
  if (statusIssue) StartGuiIntrinsic.arrayPush(progress.issues, statusIssue);
  if (
    input.keyboard && progress.keyboardDisposal !== 'unresolved' &&
    input.keyboardObservation
  ) {
    if (!isPromiseTransportReady()) return completeWithoutPromiseTransport(input, progress);
    await input.keyboardObservation.completion;
  }
  return finishCleanup(input, progress);
}

function closeResourcesWithoutPromiseTransport(input: CleanupInput): CleanupEvidence | undefined {
  return completeWithoutPromiseTransport(input, beginSynchronousCleanup(input));
}

function beginSynchronousCleanup(input: CleanupInput): CleanupProgress {
  const presentationIssues: CleanupIssue[] = [];
  const issues: CleanupIssue[] = [];
  StartGuiIntrinsic.arrayAppend(issues, input.materializationIssues);
  StartGuiIntrinsic.arrayAppend(issues, input.unobservableIssues);
  disposeLifecycle(input.workLife, 'start:gui.finalized');
  disposeLifecycle(input.stopLife, 'start:gui.finalized');

  const activeScreen = input.screen;
  const activeKeyboard = input.keyboard;
  const screenDisposal = activeScreen ? disposeWithRetry(() => activeScreen.dispose()) : 'clean';
  const keyboardDisposal = activeKeyboard
    ? disposeWithRetry(() => activeKeyboard.dispose())
    : 'clean';
  if (screenDisposal !== 'clean') {
    StartGuiIntrinsic.arrayPush(
      presentationIssues,
      freeze({
        resource: 'screen',
        state: screenDisposal === 'recovered' ? 'failed' : 'unresolved',
      }),
    );
  }
  return { presentationIssues, issues, screenDisposal, keyboardDisposal };
}

function completeWithoutPromiseTransport(
  input: CleanupInput,
  progress: CleanupProgress,
  knownApplicationIssue?: CleanupIssue,
): CleanupEvidence | undefined {
  const applicationIssue = knownApplicationIssue ?? (input.application
    ? classifyListenerClose(
      'application-listener',
      input.applicationObservation,
      input.applicationCloseFailed,
    )
    : undefined);
  if (
    applicationIssue && applicationIssue !== knownApplicationIssue &&
    !StartGuiIntrinsic.arraySome(
      progress.issues,
      (issue) => issue.resource === 'application-listener',
    )
  ) {
    StartGuiIntrinsic.arrayPush(progress.issues, applicationIssue);
  }

  if (applicationIssue?.state === 'unresolved') {
    retainApplicationOwnership(input);
  } else if (input.lease) {
    retainLease(input.lease);
  }
  if (
    input.lease && !StartGuiIntrinsic.arraySome(
      progress.issues,
      (issue) => issue.resource === 'generation-lease',
    )
  ) {
    StartGuiIntrinsic.arrayPush(
      progress.issues,
      freeze({
        resource: 'generation-lease',
        state: 'unresolved',
      }),
    );
  }

  const statusIssue = classifyListenerClose(
    'status-listener',
    input.statusObservation,
    false,
  );
  if (
    statusIssue && !StartGuiIntrinsic.arraySome(
      progress.issues,
      (issue) => issue.resource === 'status-listener',
    )
  ) {
    StartGuiIntrinsic.arrayPush(progress.issues, statusIssue);
  }
  if (statusIssue?.state === 'unresolved') retainStatus(input.status, input.statusObservation);
  return finishCleanup(input, progress);
}

function finishCleanup(
  input: CleanupInput,
  progress: CleanupProgress,
): CleanupEvidence | undefined {
  const keyboardIssue = input.keyboard
    ? classifyKeyboardClose(input.keyboardObservation, progress.keyboardDisposal)
    : undefined;
  if (keyboardIssue) StartGuiIntrinsic.arrayPush(progress.presentationIssues, keyboardIssue);

  if (input.stateObserverFailed) {
    StartGuiIntrinsic.arrayPush(
      progress.presentationIssues,
      freeze({ resource: 'state-observer', state: 'failed' }),
    );
  }

  // Retain unresolved presentation authority only after its final evidence snapshot. No retry can
  // race ahead of the evidence returned to the caller.
  if (progress.screenDisposal === 'unresolved' && input.screen) retainScreen(input.screen);
  if (keyboardIssue?.state === 'unresolved' && input.keyboard) {
    retainKeyboard(input.keyboard, input.keyboardObservation, progress.keyboardDisposal);
  }

  const allIssues: CleanupIssue[] = [];
  StartGuiIntrinsic.arrayAppend(allIssues, progress.presentationIssues);
  StartGuiIntrinsic.arrayAppend(allIssues, progress.issues);
  return allIssues.length === 0
    ? undefined
    : freeze({ kind: 'cleanup-failed', issues: freeze(allIssues) });
}

async function closeLease(lease?: ReleaseLease): Promise<CleanupIssue | undefined> {
  if (!lease) return;
  if (!isPromiseTransportReady()) {
    retainLease(lease);
    return freeze({ resource: 'generation-lease', state: 'unresolved' });
  }
  try {
    const observation = observePromiseTransport<void, boolean>(lease.release(), {
      fulfilled: () => true,
      rejected: () => false,
    });
    if (observation.kind === 'invalid' || !(await observation.promise)) {
      retainLease(lease);
      return freeze({ resource: 'generation-lease', state: 'unresolved' });
    }
  } catch {
    retainLease(lease);
    return freeze({ resource: 'generation-lease', state: 'unresolved' });
  }
}

async function closeStatus(
  status: StatusCleanupOwner,
  observation: ListenerObservation | undefined,
): Promise<CleanupIssue | undefined> {
  let closeFailed = false;
  if (!isPromiseTransportReady()) {
    const issue = classifyListenerClose('status-listener', observation, true);
    if (issue?.state === 'unresolved') retainStatus(status, observation);
    return issue;
  }
  try {
    const closing = observePromiseTransport<void, boolean>(status.close('start:gui.finalized'), {
      fulfilled: () => true,
      rejected: () => false,
    });
    closeFailed = closing.kind === 'invalid' || !(await closing.promise);
  } catch {
    closeFailed = true;
  }

  const issue = classifyListenerClose('status-listener', observation, closeFailed);
  if (issue?.state === 'unresolved') retainStatus(status, observation);
  return issue;
}

function joinCleanup(
  lease: Promise<CleanupIssue | undefined>,
  status: Promise<CleanupIssue | undefined>,
):
  | Promise<
    Readonly<{
      lease: CleanupIssue | undefined;
      status: CleanupIssue | undefined;
    }>
  >
  | undefined {
  if (!isPromiseTransportReady()) return;
  const deferred = createPromiseDeferred<
    Readonly<{
      lease: CleanupIssue | undefined;
      status: CleanupIssue | undefined;
    }>
  >();
  let leaseSettled = false;
  let statusSettled = false;
  let leaseIssue: CleanupIssue | undefined;
  let statusIssue: CleanupIssue | undefined;
  const resolve = () => {
    if (leaseSettled && statusSettled) {
      deferred.resolve(freeze({ lease: leaseIssue, status: statusIssue }));
    }
  };
  const leaseObservation = observePromiseTransport<CleanupIssue | undefined, void>(lease, {
    fulfilled(value) {
      leaseIssue = value;
      leaseSettled = true;
      resolve();
    },
    rejected() {
      leaseIssue = freeze({ resource: 'generation-lease', state: 'unresolved' });
      leaseSettled = true;
      resolve();
    },
  });
  const statusObservation = observePromiseTransport<CleanupIssue | undefined, void>(status, {
    fulfilled(value) {
      statusIssue = value;
      statusSettled = true;
      resolve();
    },
    rejected() {
      statusIssue = freeze({ resource: 'status-listener', state: 'unresolved' });
      statusSettled = true;
      resolve();
    },
  });
  return leaseObservation.kind === 'observed' && statusObservation.kind === 'observed'
    ? deferred.promise
    : undefined;
}

function classifyListenerClose(
  resource: 'application-listener' | 'status-listener',
  observation: ListenerObservation | undefined,
  closeFailed: boolean,
): CleanupIssue | undefined {
  if (!observation || !observation.settled) {
    return freeze({ resource, state: 'unresolved' });
  }
  return closeFailed || observation.failed ? freeze({ resource, state: 'failed' }) : undefined;
}

function classifyKeyboardClose(
  observation: ListenerObservation | undefined,
  disposal: DisposalResult,
): CleanupIssue | undefined {
  if (disposal === 'unresolved' || !observation || !observation.settled) {
    return freeze({ resource: 'keyboard', state: 'unresolved' });
  }
  return disposal === 'recovered' || observation.failed
    ? freeze({ resource: 'keyboard', state: 'failed' })
    : undefined;
}

function retainApplicationOwnership(input: CleanupInput): void {
  if (input.application && input.applicationObservation) {
    retainApplication(input.application, input.applicationObservation, input.lease);
  } else if (input.application) {
    retainUnobservedApplication(input.application, input.lease);
  } else if (input.lease) {
    retainLease(input.lease);
  }
}

function retainApplication(
  application: ApplicationOwner,
  observation: ListenerObservation,
  lease?: ReleaseLease,
): void {
  const record: Extract<RetainedOwnership, { kind: 'application' }> = {
    kind: 'application',
    application,
    observation,
    lease,
  };
  StartGuiIntrinsic.setAdd(RETAINED_OWNERSHIP, record);
  observation.onSettled(() => {
    if (!lease) {
      StartGuiIntrinsic.setDelete(RETAINED_OWNERSHIP, record);
      return;
    }
    releaseRetainedLease(
      lease,
      () => StartGuiIntrinsic.setDelete(RETAINED_OWNERSHIP, record),
    );
  });
}

function retainUnobservedApplication(
  application: ApplicationOwner,
  lease?: ReleaseLease,
): void {
  StartGuiIntrinsic.setAdd(RETAINED_OWNERSHIP, {
    kind: 'application-unobserved',
    application,
    lease,
  });
}

function retainStatus(
  status: StatusCleanupOwner,
  observation?: ListenerObservation,
): void {
  const record: Extract<RetainedOwnership, { kind: 'status' }> = {
    kind: 'status',
    status,
    observation,
  };
  StartGuiIntrinsic.setAdd(RETAINED_OWNERSHIP, record);
  observation?.onSettled(() => StartGuiIntrinsic.setDelete(RETAINED_OWNERSHIP, record));
}

function retainLease(lease: ReleaseLease): void {
  StartGuiIntrinsic.setAdd(RETAINED_OWNERSHIP, { kind: 'lease', lease });
}

function releaseRetainedLease(lease: ReleaseLease, released: () => void): void {
  if (!isPromiseTransportReady()) return;
  try {
    const observation = observePromiseTransport<void, void>(lease.release(), {
      fulfilled: released,
      rejected() {
        // Rooted release is one-shot; unresolved ownership remains rooted until process exit.
      },
    });
    if (observation.kind === 'invalid') return;
  } catch {
    // Rooted release is one-shot; unresolved ownership remains rooted until process exit.
  }
}

function retainKeyboard(
  keyboard: KeyboardCleanupOwner,
  observation: ListenerObservation | undefined,
  disposal: DisposalResult,
): void {
  const record: Extract<RetainedOwnership, { kind: 'keyboard' }> = {
    kind: 'keyboard',
    keyboard,
    observation,
  };
  // Listener settlement can prove absence later; it must not replay an already accepted stop.
  let disposalAccepted = disposal !== 'unresolved';
  const releaseIfAbsent = () => {
    if (disposalAccepted && observation?.settled) {
      StartGuiIntrinsic.setDelete(RETAINED_OWNERSHIP, record);
    }
  };
  const retry = () => {
    if (disposalAccepted) {
      releaseIfAbsent();
      return;
    }
    try {
      keyboard.dispose();
      disposalAccepted = true;
    } catch {
      // The strongly retained handle remains retryable at the next owned settlement edge.
    }
    releaseIfAbsent();
  };

  StartGuiIntrinsic.setAdd(RETAINED_OWNERSHIP, record);
  if (!observation || observation.settled) return;
  observation.onSettled(retry);
}

function retainScreen(screen: ScreenCleanupOwner): void {
  StartGuiIntrinsic.setAdd(RETAINED_OWNERSHIP, { kind: 'screen', screen });
}

function disposeLifecycle(life: t.Abortable, reason: unknown): void {
  try {
    life.dispose(reason);
  } catch {
    // Internal cancellation delivery must not prevent owned resource cleanup.
  }
}

type DisposalResult = 'clean' | 'recovered' | 'unresolved';

function disposeWithRetry(dispose: () => void): DisposalResult {
  try {
    dispose();
    return 'clean';
  } catch {
    try {
      dispose();
      return 'recovered';
    } catch {
      return 'unresolved';
    }
  }
}

function observeListener(
  finished: Promise<void>,
  onSettled: (failed: boolean, transportReady: boolean) => void,
): ListenerObservation {
  let settled = false;
  let failed = false;
  const completion = createPromiseDeferred<void>();
  const settlementListeners = StartGuiIntrinsic.createSet<() => void>();
  const settle = (didFail: boolean) => {
    if (settled) return;
    failed = didFail;
    settled = true;
    try {
      onSettled(didFail, isPromiseTransportReady());
    } catch {
      // Observer failure cannot create an unowned promise rejection.
    }
    const listeners = StartGuiIntrinsic.setSnapshot(settlementListeners);
    StartGuiIntrinsic.setClear(settlementListeners);
    for (let index = 0; index < listeners.length; index += 1) {
      try {
        listeners[index]();
      } catch {
        // Retained-owner callbacks cannot escape listener settlement ownership.
      }
    }
    completion.resolve();
  };
  const observation = observePromiseTransport<void, void>(finished, {
    fulfilled: () => settle(false),
    rejected: () => settle(true),
  });
  if (observation.kind === 'invalid') {
    throw createOwnedError('start:gui listener completion transport invalid.');
  }
  return {
    get settled() {
      return settled;
    },
    completion: completion.promise,
    get failed() {
      return failed;
    },
    onSettled(listener) {
      if (settled) {
        try {
          listener();
        } catch {
          // Retained-owner callbacks cannot escape an already settled listener.
        }
        return;
      }
      StartGuiIntrinsic.setAdd(settlementListeners, listener);
    },
  };
}

function errorMessage(error: Error): string {
  try {
    const descriptor = getOwnPropertyDescriptor(error, 'message');
    return descriptor && 'value' in descriptor && Is.string(descriptor.value)
      ? descriptor.value
      : 'start:gui failed.';
  } catch {
    return 'start:gui failed.';
  }
}

const INVALID_STATUS_OWNER: StatusOwnerSnapshot = freeze({ kind: 'invalid' });
const INVALID_KEYBOARD_OWNER: KeyboardOwnerSnapshot = freeze({ kind: 'invalid' });
const INVALID_SCREEN_OWNER: ScreenOwnerSnapshot = freeze({ kind: 'invalid' });
const DATA_UNAVAILABLE = freeze({ ok: false as const });

function cleanupError(evidence: CleanupEvidence): Error {
  const error = createOwnedError('start:gui cleanup failed.');
  defineProperty(error, 'cleanup', {
    configurable: false,
    enumerable: true,
    value: evidence,
  });
  return error;
}
