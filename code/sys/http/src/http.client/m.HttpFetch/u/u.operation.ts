import { type t, Time } from '../common.ts';
import { type FailureKind, type NominalFailure, policyFailure } from './u.failure.ts';

export const CANCELLED = Symbol('HttpFetch.cancelled');
const MAX_TIMER_MSECS = 2_147_483_647;
type Terminal = typeof CANCELLED | NominalFailure;

/** Create one deadline, cancellation, and body-lease authority. */
export function createOperation(externalSignal: AbortSignal, timeout: t.Msecs) {
  const controller = new AbortController();
  const deadline = performance.now() + timeout;
  const cancelledBodies = new WeakSet<ReadableStream<Uint8Array>>();
  let terminal: Terminal | undefined;
  let rejectTerminal: (cause: Terminal) => void = () => {};
  const terminalPromise = new Promise<never>((_resolve, reject) => (rejectTerminal = reject));
  terminalPromise.catch(() => undefined);

  const stop = (cause: Terminal) => {
    if (terminal) return;
    terminal = cause;
    controller.abort(cause === CANCELLED ? externalSignal.reason : cause);
    rejectTerminal(cause);
  };
  const onAbort = () => stop(CANCELLED);
  externalSignal.addEventListener('abort', onAbort, { once: true });
  if (externalSignal.aborted) onAbort();

  let timer: ReturnType<typeof Time.delay> | undefined;
  const scheduleDeadline = () => {
    if (terminal) return;
    const remaining = deadline - performance.now();
    if (remaining <= 0) {
      stop(policyFailure('response-timeout'));
      return;
    }
    const delay = Math.max(1, Math.min(MAX_TIMER_MSECS, Math.ceil(remaining)));
    timer = Time.delay(delay, scheduleDeadline);
  };
  scheduleDeadline();

  const checkDeadline = () => {
    if (!terminal && performance.now() >= deadline) {
      stop(policyFailure('response-timeout'));
    }
  };

  const cancel = (
    body: ReadableStream<Uint8Array> | null,
    reader?: ReadableStreamDefaultReader<Uint8Array>,
  ): Promise<void> => {
    if (!body || cancelledBodies.has(body)) return Promise.resolve();
    cancelledBodies.add(body);

    try {
      const pending = reader ? reader.cancel() : body.cancel();
      return Promise.resolve(pending).catch(() => undefined);
    } catch {
      return Promise.resolve();
    }
  };

  const api = {
    get signal() {
      return controller.signal;
    },
    get terminal() {
      return terminal;
    },
    throwIfStopped(): void {
      checkDeadline();
      if (terminal) throw terminal;
    },
    fail(kind: FailureKind): never {
      checkDeadline();
      stop(policyFailure(kind));
      throw terminal;
    },
    race<T>(input: PromiseLike<T>): Promise<T> {
      checkDeadline();
      if (terminal) return Promise.reject(terminal);
      return Promise.race([Promise.resolve(input), terminalPromise]);
    },
    raceFetch(input: Promise<Response>): Promise<Response> {
      const watched = input.then((response) => {
        if (terminal) void cancel(response.body);
        return response;
      });
      return api.race(watched);
    },
    cancelReader(
      body: ReadableStream<Uint8Array>,
      reader: ReadableStreamDefaultReader<Uint8Array>,
    ): Promise<void> {
      return cancel(body, reader);
    },
    async cancelResponse(response: Response): Promise<void> {
      await api.race(cancel(response.body));
    },
    dispose(): void {
      timer?.cancel();
      externalSignal.removeEventListener('abort', onAbort);
    },
  };
  return api;
}

export type Operation = ReturnType<typeof createOperation>;
