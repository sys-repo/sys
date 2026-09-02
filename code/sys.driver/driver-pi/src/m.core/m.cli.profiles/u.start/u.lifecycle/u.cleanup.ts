import { StartGuiIntrinsic, type t } from '../common.ts';

import {
  createPromiseDeferred,
  isPromiseTransportReady,
  microtaskPromise,
  observePromiseTransport,
  resolvedPromise,
} from '../u.promise.ts';
import {
  retainApplicationOwnership,
  retainKeyboard,
  retainLease,
  retainScreen,
  retainStatus,
} from './u.retention.ts';
import type {
  CleanupEvidence,
  CleanupInput,
  CleanupIssue,
  DisposalResult,
  ListenerObservation,
  StatusCleanupOwner,
} from './t.ts';

type CleanupProgress = Readonly<{
  presentationIssues: CleanupIssue[];
  issues: CleanupIssue[];
  screenDisposal: DisposalResult;
  keyboardDisposal: DisposalResult;
}>;

export async function closeResources(
  input: CleanupInput,
): Promise<CleanupEvidence | undefined> {
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
    closingApplication = StartGuiIntrinsic.freeze({ kind: 'invalid' });
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
        ? StartGuiIntrinsic.freeze({
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
  if (applicationIssue?.state === 'unresolved') {
    retainApplicationOwnership(input.application, input.applicationObservation, input.lease);
  }
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

export function closeResourcesWithoutPromiseTransport(
  input: CleanupInput,
): CleanupEvidence | undefined {
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
      StartGuiIntrinsic.freeze({
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
    retainApplicationOwnership(input.application, input.applicationObservation, input.lease);
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
      StartGuiIntrinsic.freeze({
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
      StartGuiIntrinsic.freeze({ resource: 'state-observer', state: 'failed' }),
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
  return allIssues.length === 0 ? undefined : StartGuiIntrinsic.freeze({
    kind: 'cleanup-failed',
    issues: StartGuiIntrinsic.freeze(allIssues),
  });
}

async function closeLease(lease?: CleanupInput['lease']): Promise<CleanupIssue | undefined> {
  if (!lease) return;
  if (!isPromiseTransportReady()) {
    retainLease(lease);
    return StartGuiIntrinsic.freeze({ resource: 'generation-lease', state: 'unresolved' });
  }
  try {
    const observation = observePromiseTransport<void, boolean>(lease.release(), {
      fulfilled: () => true,
      rejected: () => false,
    });
    if (observation.kind === 'invalid' || !(await observation.promise)) {
      retainLease(lease);
      return StartGuiIntrinsic.freeze({ resource: 'generation-lease', state: 'unresolved' });
    }
  } catch {
    retainLease(lease);
    return StartGuiIntrinsic.freeze({ resource: 'generation-lease', state: 'unresolved' });
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
      deferred.resolve(StartGuiIntrinsic.freeze({ lease: leaseIssue, status: statusIssue }));
    }
  };
  const leaseObservation = observePromiseTransport<CleanupIssue | undefined, void>(lease, {
    fulfilled(value) {
      leaseIssue = value;
      leaseSettled = true;
      resolve();
    },
    rejected() {
      leaseIssue = StartGuiIntrinsic.freeze({
        resource: 'generation-lease',
        state: 'unresolved',
      });
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
      statusIssue = StartGuiIntrinsic.freeze({
        resource: 'status-listener',
        state: 'unresolved',
      });
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
    return StartGuiIntrinsic.freeze({ resource, state: 'unresolved' });
  }
  return closeFailed || observation.failed
    ? StartGuiIntrinsic.freeze({ resource, state: 'failed' })
    : undefined;
}

function classifyKeyboardClose(
  observation: ListenerObservation | undefined,
  disposal: DisposalResult,
): CleanupIssue | undefined {
  if (disposal === 'unresolved' || !observation || !observation.settled) {
    return StartGuiIntrinsic.freeze({ resource: 'keyboard', state: 'unresolved' });
  }
  return disposal === 'recovered' || observation.failed
    ? StartGuiIntrinsic.freeze({ resource: 'keyboard', state: 'failed' })
    : undefined;
}

function disposeLifecycle(life: t.Abortable, reason: unknown): void {
  try {
    life.dispose(reason);
  } catch {
    // Internal cancellation delivery must not prevent owned resource cleanup.
  }
}

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
