import { StartGuiIntrinsic } from '../common.ts';

import type { ApplicationOwner } from '../u.identity/mod.ts';
import type { ReleaseLease } from '../u.materialize.ts';
import { createOwnedError } from '../u.error.ts';
import {
  createPromiseDeferred,
  isPromiseTransportReady,
  observePromiseTransport,
} from '../u.promise.ts';
import type {
  DisposalResult,
  KeyboardCleanupOwner,
  ListenerObservation,
  ScreenCleanupOwner,
  StatusCleanupOwner,
} from './t.ts';

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

export function retainUnobservableOperation(
  resource: 'materialization' | 'application-host',
  transport: unknown,
  lease?: ReleaseLease,
): void {
  StartGuiIntrinsic.setAdd(RETAINED_OWNERSHIP, {
    kind: 'operation-unobserved',
    resource,
    transport,
    lease,
  });
}

export function retainUnobservablePresentation(
  resource: 'keyboard' | 'screen',
  value: unknown,
): void {
  StartGuiIntrinsic.setAdd(RETAINED_OWNERSHIP, {
    kind: 'presentation-unobserved',
    resource,
    value,
  });
}

export function retainApplicationOwnership(
  application: ApplicationOwner | undefined,
  observation: ListenerObservation | undefined,
  lease: ReleaseLease | undefined,
): void {
  if (application && observation) {
    retainApplication(application, observation, lease);
  } else if (application) {
    retainUnobservedApplication(application, lease);
  } else if (lease) {
    retainLease(lease);
  }
}

export function retainStatus(
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

export function retainLease(lease: ReleaseLease): void {
  StartGuiIntrinsic.setAdd(RETAINED_OWNERSHIP, { kind: 'lease', lease });
}

export function retainKeyboard(
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

export function retainScreen(screen: ScreenCleanupOwner): void {
  StartGuiIntrinsic.setAdd(RETAINED_OWNERSHIP, { kind: 'screen', screen });
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

export function observeListener(
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
