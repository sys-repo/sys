/**
 * @module
 * Status observation and bounded termination for one capability-bearing child handle.
 */
import { Is, Num, type t, Time } from '../common.ts';
import type { OperationDeadline } from './u.operation.ts';

const DEFAULT_TIMEOUT = 5_000 as t.Msecs;

export type OwnedChildStatusResult =
  | { readonly ok: true; readonly status: Deno.CommandStatus }
  | { readonly ok: false; readonly error: unknown };

export type OwnedChildStatusOperation = {
  readonly promise: Promise<OwnedChildStatusResult>;
  readonly current: OwnedChildStatusResult | undefined;
};

type OwnedChildSignal = 'SIGTERM' | 'SIGKILL';

export type OwnedChildTerminationFailure = {
  readonly phase: `signal:${OwnedChildSignal}` | 'status' | 'status:settle';
  readonly error: unknown;
};

export type OwnedChildTerminationResult = {
  readonly actions: readonly t.Process.Terminate.Action[];
  /** Complete termination-local failures in their internal occurrence order. */
  readonly failures: readonly OwnedChildTerminationFailure[];
  readonly status?: OwnedChildStatusResult;
  readonly forceTimedOut: boolean;
};

type TerminateOptions = {
  readonly graceTimeout?: t.Msecs;
  readonly settleTimeout?: t.Msecs;
  readonly deadline?: OperationDeadline;
  /** Report each failure at occurrence time for merger with concurrent lifecycle ledgers. */
  readonly onFailure?: (failure: OwnedChildTerminationFailure) => void;
};

/** Observe one previously obtained child-status operation. */
export function observeChildStatus(
  status: Promise<Deno.CommandStatus>,
): OwnedChildStatusOperation {
  let current: OwnedChildStatusResult | undefined;
  const promise = status.then(
    (value): OwnedChildStatusResult => ({ ok: true, status: value }),
    (error): OwnedChildStatusResult => ({ ok: false, error }),
  );
  void promise.then((value) => (current = value));
  return {
    promise,
    get current() {
      return current;
    },
  };
}

/**
 * Run the shared signal/status phase for one capability-bearing child handle.
 *
 * The returned failures summarize this termination phase. `onFailure` reports synchronously at
 * occurrence time so callers can preserve causal order relative to concurrent stream failures.
 */
export async function terminateOwnedChild(
  child: Deno.ChildProcess,
  status: OwnedChildStatusOperation,
  options: TerminateOptions = {},
): Promise<OwnedChildTerminationResult> {
  const { deadline, onFailure } = options;
  const graceTimeout = timeoutOf('grace', options.graceTimeout);
  const settleTimeout = timeoutOf('settlement', options.settleTimeout);
  const remaining = (timeout: t.Msecs) => deadline?.remaining(timeout) ?? timeout;
  const actions: t.Process.Terminate.Action[] = [];
  const failures: OwnedChildTerminationFailure[] = [];
  let active = true;
  let statusFailureRecorded = false;

  const report = (failure: OwnedChildTerminationFailure) => {
    failures.push(failure);
    onFailure?.(failure);
  };
  const reportStatus = (value: OwnedChildStatusResult | undefined) => {
    if (statusFailureRecorded || value?.ok !== false) return;
    statusFailureRecorded = true;
    report({ phase: 'status', error: value.error });
  };
  const attempt = (name: OwnedChildSignal) => {
    const action = sendSignal(child, name);
    actions.push(action);
    if (!action.ok) report({ phase: `signal:${name}`, error: action.error });
  };
  const complete = () => result(actions, failures, status);

  reportStatus(status.current);
  void status.promise.then((value) => {
    if (active) reportStatus(value);
  });

  try {
    attempt('SIGTERM');
    if (await exitedWithin(status, remaining(graceTimeout))) return complete();

    attempt('SIGKILL');
    if (status.current && !status.current.ok) return complete();
    const finalTimeout = remaining(settleTimeout);
    if (await exitedWithin(status, finalTimeout)) return complete();

    report({
      phase: 'status:settle',
      error: new Error(
        `Owned process ${child.pid} timed out settling after SIGKILL within ${finalTimeout}ms.`,
      ),
    });
    return complete();
  } finally {
    active = false;
  }
}

/**
 * Helpers:
 */
function timeoutOf(label: string, input?: t.Msecs): t.Msecs {
  if (input === undefined) return DEFAULT_TIMEOUT;
  if (
    !Is.num(input) ||
    !Num.Is.safeInt(input) ||
    input < 0 ||
    input > Time.Delay.MAX
  ) {
    throw new Error(
      `Process: invalid owned-child ${label} timeout: ${String(input)}.`,
    );
  }
  return input;
}

function result(
  actions: readonly t.Process.Terminate.Action[],
  failures: readonly OwnedChildTerminationFailure[],
  status: OwnedChildStatusOperation,
): OwnedChildTerminationResult {
  const current = status.current;
  return {
    actions,
    failures,
    status: current,
    forceTimedOut: current === undefined,
  };
}

async function exitedWithin(status: OwnedChildStatusOperation, timeout: t.Msecs) {
  const deadline = Time.delay(timeout);
  const timedOut = deadline.then(() => false);
  const exited = status.promise.then((result) => result.ok ? true : timedOut);

  try {
    return await Promise.race([exited, timedOut]);
  } finally {
    deadline.cancel();
  }
}

function sendSignal(
  child: Deno.ChildProcess,
  name: OwnedChildSignal,
): t.Process.Terminate.Action {
  try {
    child.kill(name);
    return { signal: name, ok: true };
  } catch (error) {
    return { signal: name, ok: false, error };
  }
}
