import type { t } from '../common.ts';
import { captureOperation, type OperationDeadline, withinDeadline } from './u.operation.ts';

type ByteStream = ReadableStream<Uint8Array>;
type StreamReader = ReadableStreamDefaultReader<Uint8Array>;

type StreamSettlement<T> =
  | { readonly settled: true; readonly value: T }
  | { readonly settled: false };

type SettleOwnedStreamArgs<T> = {
  readonly stream: ByteStream;
  readonly reader: StreamReader;
  readonly operation?: Promise<T>;
  readonly drain: boolean;
  readonly deadline: OperationDeadline;
  readonly timeout: t.Msecs;
  readonly observe: (value: T) => boolean;
  readonly report: (phase: 'cancel' | 'release' | 'settle', error: unknown) => void;
  readonly timeoutError: (phase: 'cancel' | 'settle') => Error;
};

/** Boundedly drain or cancel one reader-owned child stream, then settle its pump operation. */
export async function settleOwnedStream<T>(
  args: SettleOwnedStreamArgs<T>,
): Promise<StreamSettlement<T>> {
  const { stream, reader, operation, drain, deadline, timeout, observe, report, timeoutError } =
    args;
  let settlement: StreamSettlement<T> = { settled: false };
  let drainTimedOut = false;

  const waitForOperation = () => {
    if (!operation) return undefined;
    return withinDeadline(operation, deadline.remaining(timeout));
  };
  const observeSettlement = (value: T) => {
    settlement = { settled: true, value };
    return observe(value);
  };
  const release = () => {
    if (!stream.locked) return;
    try {
      reader.releaseLock();
    } catch (error) {
      report('release', error);
    }
  };

  if (operation && drain) {
    const drained = await waitForOperation();
    if (drained?.kind === 'settled' && observeSettlement(drained.value)) return settlement;
    if (drained?.kind === 'timeout') {
      drainTimedOut = true;
      report('settle', timeoutError('settle'));
    }
  }

  const cancel = stream.locked
    ? captureOperation(() => reader.cancel())
    : captureOperation(() => stream.cancel());
  const cancellation = await withinDeadline(cancel, deadline.remaining(timeout));
  if (cancellation.kind === 'timeout') {
    report('cancel', timeoutError('cancel'));
  } else if (!cancellation.value.ok) {
    report('cancel', cancellation.value.error);
  }

  if (operation && !settlement.settled) {
    let settled = await waitForOperation();
    if (settled?.kind === 'timeout') {
      // A reader cancellation may resolve before its pending read/pump settles. Releasing the lock
      // can unblock that operation, so retry once within the same aggregate deadline.
      release();
      settled = await waitForOperation();
    }

    if (settled?.kind === 'settled') {
      observeSettlement(settled.value);
    } else if (!drainTimedOut) {
      report('settle', timeoutError('settle'));
    }
  }

  release();
  return settlement;
}
