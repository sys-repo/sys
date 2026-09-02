import { StartGuiIntrinsic, type t } from '../common.ts';

import { createOwnedError } from '../u.error.ts';
import { captureFailure, type FailureOperation } from '../u.failure.ts';
import {
  admitGenerationPkg,
  admitMaterialization,
  type AdmittedGeneration,
  type AdmittedMaterialization,
} from '../u.identity.ts';
import type { Supervisor, TerminalEvent, WorkAdmission } from '../u.lifecycle/mod.ts';
import { materializationError } from '../u.materialize.ts';
import {
  isPromiseTransportReady,
  observePromiseTransport,
  PROMISE_TRANSPORT_ERROR,
  resolvedPromise,
} from '../u.promise.ts';
import type { BootResult, Observed } from './t.ts';

const RETAINED_OPEN_RESULTS = StartGuiIntrinsic.createSet<unknown>();

export const READY_RESULT: BootResult = StartGuiIntrinsic.freeze({ kind: 'ready' });
export const EXTERNAL_STOP_RESULT: BootResult = StartGuiIntrinsic.freeze({
  kind: 'stop',
  source: 'external-cancellation',
});
export const OBSERVED_FAILURE: Observed<never> = StartGuiIntrinsic.freeze({ kind: 'failed' });
const OBSERVED_FAILURE_PROMISE = resolvedPromise(OBSERVED_FAILURE);
const FAILED_RESULT: BootResult = StartGuiIntrinsic.freeze({ kind: 'failed' });
const TRUSTED_STOP_RESULT: BootResult = StartGuiIntrinsic.freeze({
  kind: 'stop',
  source: 'trusted-control',
});

export function assertPromiseTransportReady(): void {
  if (!isPromiseTransportReady()) throw createOwnedError(PROMISE_TRANSPORT_ERROR);
}

export function beginPromise<T>(invoke: () => Promise<T>): Promise<T> {
  assertPromiseTransportReady();
  const promise = invoke();
  assertPromiseTransportReady();
  return promise;
}

export function awaitPromise<T>(promise: Promise<T>): Promise<T> {
  assertPromiseTransportReady();
  return promise;
}

export function beginCheckpoint(supervisor: Supervisor): Promise<TerminalEvent | undefined> {
  return beginPromise(() => supervisor.checkpoint());
}

export async function admitAfterCheckpoint<T>(
  supervisor: Supervisor,
  action: () => T,
): Promise<WorkAdmission<T>> {
  assertPromiseTransportReady();
  await beginCheckpoint(supervisor);
  return supervisor.admitWork(action);
}

export function beginAdmission<T>(
  supervisor: Supervisor,
  action: () => T,
): Promise<WorkAdmission<T>> {
  return beginPromise(() => admitAfterCheckpoint(supervisor, action));
}

type ObservedFailureInput = Readonly<{
  operation: FailureOperation;
  supervisor: Supervisor;
}>;

type ObserveOperationInput<T, R> = Readonly<{
  operation: FailureOperation;
  supervisor: Supervisor;
  invoke: () => Promise<T>;
  admit: (value: T) => R;
  unobservableResource?: 'application-host';
}>;

type ObserveMaterializationInput = Readonly<{
  operation: FailureOperation;
  supervisor: Supervisor;
  invoke: () => Promise<unknown>;
  expected: Readonly<t.Pkg>;
  diagnostics: Parameters<typeof admitGenerationPkg>[0]['diagnostics'];
}>;

type AdmittedMaterializationFailure = Extract<AdmittedMaterialization, { kind: 'failed' }>;

export function observeOperation<T, R>(input: ObserveOperationInput<T, R>): Promise<Observed<R>> {
  let invoked = false;
  let transport: unknown;
  const invocationEvidence = StartGuiIntrinsic.freeze({
    kind: 'invoked-without-transport' as const,
  });
  try {
    assertPromiseTransportReady();
    invoked = true;
    transport = input.invoke();
    const observation = observePromiseTransport<T, Observed<R>>(transport, {
      fulfilled: (value) => admitObservedValue(input, value),
      rejected: (cause) => rejectObservedValue(input, cause),
    });
    if (observation.kind === 'observed') return observation.promise;
    recordUnobservableOperation(input, transport, invocationEvidence);
    publishOperationFailure(input, undefined);
  } catch (cause) {
    if (invoked) recordUnobservableOperation(input, transport, invocationEvidence);
    publishOperationFailure(input, cause);
  }
  return OBSERVED_FAILURE_PROMISE;
}

export function observeMaterialization(
  input: ObserveMaterializationInput,
): Promise<Observed<AdmittedGeneration>> {
  let invoked = false;
  let transport: unknown;
  const invocationEvidence = StartGuiIntrinsic.freeze({
    kind: 'invoked-without-transport' as const,
  });
  try {
    assertPromiseTransportReady();
    invoked = true;
    transport = input.invoke();
    const observation = observePromiseTransport<unknown, Observed<AdmittedGeneration>>(
      transport,
      {
        fulfilled: (result) => admitObservedMaterialization(input, result),
        rejected: (cause) => rejectObservedValue(input, cause),
      },
    );
    if (observation.kind === 'observed') return observation.promise;
    input.supervisor.recordUnobservableOperation(
      'materialization',
      transport === undefined ? invocationEvidence : transport,
    );
    publishOperationFailure(input, undefined);
  } catch (cause) {
    if (invoked) {
      input.supervisor.recordUnobservableOperation(
        'materialization',
        transport === undefined ? invocationEvidence : transport,
      );
    }
    publishOperationFailure(input, cause);
  }
  return OBSERVED_FAILURE_PROMISE;
}

function admitObservedValue<T, R>(
  input: ObserveOperationInput<T, R>,
  value: T,
): Observed<R> {
  const reaction = input.supervisor.beginObservedReaction();
  try {
    const admitted = input.admit(value);
    if (!isPromiseTransportReady()) {
      publishPromiseTransportFailure(input.supervisor, input.operation, reaction);
      return OBSERVED_FAILURE;
    }
    return StartGuiIntrinsic.freeze({ kind: 'value', value: admitted });
  } catch (cause) {
    publishObservedCause(input, reaction, cause);
    return OBSERVED_FAILURE;
  }
}

function admitObservedMaterialization(
  input: ObserveMaterializationInput,
  result: unknown,
): Observed<AdmittedGeneration> {
  const reaction = input.supervisor.beginObservedReaction();
  try {
    const settlement = admitMaterialization({
      generation: result,
      diagnostics: input.diagnostics,
    });
    if (settlement.kind === 'failed') {
      return refuseObservedMaterialization(input, reaction, settlement);
    }

    // Retain independently admitted cleanup truth before identity can refuse startup.
    input.supervisor.recordMaterialization(settlement);
    if (!isPromiseTransportReady()) {
      publishPromiseTransportFailure(input.supervisor, input.operation, reaction);
      return OBSERVED_FAILURE;
    }
    const admitted = admitGenerationPkg({
      expected: input.expected,
      generation: settlement,
      diagnostics: input.diagnostics,
    });
    return StartGuiIntrinsic.freeze({ kind: 'value', value: admitted });
  } catch (cause) {
    publishObservedCause(input, reaction, cause);
    return OBSERVED_FAILURE;
  }
}

function refuseObservedMaterialization(
  input: ObserveMaterializationInput,
  reaction: ReturnType<Supervisor['beginObservedReaction']>,
  settlement: AdmittedMaterializationFailure,
): Observed<never> {
  if (!isPromiseTransportReady()) {
    input.supervisor.recordMaterialization(settlement);
    publishPromiseTransportFailure(input.supervisor, input.operation, reaction);
    return OBSERVED_FAILURE;
  }

  const failure = captureFailure(materializationError(settlement), input.operation);
  const won = input.supervisor.publishObservedFailure(
    reaction,
    failure.error,
    failure.state,
  );
  if (!won) input.supervisor.recordMaterialization(settlement);
  return OBSERVED_FAILURE;
}

function rejectObservedValue(
  input: ObservedFailureInput,
  cause: unknown,
): Observed<never> {
  const reaction = input.supervisor.beginObservedReaction();
  publishObservedCause(input, reaction, cause);
  return OBSERVED_FAILURE;
}

function publishObservedCause(
  input: ObservedFailureInput,
  reaction: ReturnType<Supervisor['beginObservedReaction']>,
  cause: unknown,
): void {
  if (!isPromiseTransportReady()) {
    publishPromiseTransportFailure(input.supervisor, input.operation, reaction);
    return;
  }
  const failure = captureFailure(cause, input.operation);
  input.supervisor.publishObservedFailure(reaction, failure.error, failure.state);
}

function recordUnobservableOperation<T, R>(
  input: ObserveOperationInput<T, R>,
  transport: unknown,
  invocationEvidence: object,
): void {
  if (!input.unobservableResource) return;
  input.supervisor.recordUnobservableOperation(
    input.unobservableResource,
    transport === undefined ? invocationEvidence : transport,
  );
}

function publishOperationFailure(input: ObservedFailureInput, cause: unknown): void {
  const failure = captureFailure(cause, input.operation);
  input.supervisor.publishFailure(failure.error, failure.state);
}

export function admitOpenResult(input: unknown, onFailure: () => void): void {
  if (input === undefined) return;
  try {
    const observation = observePromiseTransport<unknown, void>(input, {
      fulfilled() {},
      rejected() {
        onFailure();
      },
    });
    if (observation.kind === 'observed') return;
  } catch {
    // Unobservable opener work is retained and reduced to bounded presentation evidence below.
  }
  StartGuiIntrinsic.setAdd(RETAINED_OPEN_RESULTS, input);
  onFailure();
}

export function resultAfterObservedFailure(supervisor: Supervisor): BootResult {
  const terminal = supervisor.currentBlocker;
  return terminal ? bootResultOf(terminal) : FAILED_RESULT;
}

export function bootResultOf(event: TerminalEvent): BootResult {
  if (event.kind === 'failure') return FAILED_RESULT;
  return event.source === 'external-cancellation' ? EXTERNAL_STOP_RESULT : TRUSTED_STOP_RESULT;
}

function publishPromiseTransportFailure(
  supervisor: Supervisor,
  operation: FailureOperation,
  reaction: ReturnType<Supervisor['beginObservedReaction']>,
): void {
  supervisor.publishObservedFailure(
    reaction,
    createOwnedError(PROMISE_TRANSPORT_ERROR),
    captureFailure(undefined, operation).state,
  );
}
