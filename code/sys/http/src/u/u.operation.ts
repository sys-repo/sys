import { Num, type t, Time } from '../common.ts';
import type { HttpOperation } from './t.ts';

/** Own one deadline, terminal latch, abort bridge, and set of body leases. */
export function createHttpOperation<TCause>(
  externalSignal: AbortSignal,
  timeout: number,
  causes: { readonly cancelled: TCause; readonly timeout: TCause },
): HttpOperation<TCause> {
  const controller = new AbortController();
  const deadline = performance.now() + timeout;
  const cancelledBodies = new WeakSet<ReadableStream<Uint8Array>>();
  let terminal: TCause | undefined;
  let retired = false;
  const { promise: terminalPromise, reject: rejectTerminal } = Promise.withResolvers<never>();
  terminalPromise.catch(() => undefined);

  const stop = (cause: TCause) => {
    if (retired || terminal !== undefined) return;
    terminal = cause;
    controller.abort(cause === causes.cancelled ? externalSignal.reason : cause);
    rejectTerminal(cause);
  };
  const onAbort = () => stop(causes.cancelled);
  externalSignal.addEventListener('abort', onAbort, { once: true });
  if (externalSignal.aborted) onAbort();

  let timer: t.Time.Delay.Promise | undefined;
  const schedule = () => {
    if (retired || terminal !== undefined) return;
    const remaining = deadline - performance.now();
    if (remaining <= 0) return stop(causes.timeout);
    timer = Time.delay(Num.clamp(1, Time.Delay.MAX, Math.ceil(remaining)), schedule);
  };
  schedule();

  const checkDeadline = () => {
    if (!retired && terminal === undefined && performance.now() >= deadline) stop(causes.timeout);
  };
  const cancel = (
    body: ReadableStream<Uint8Array> | null,
    reader?: ReadableStreamDefaultReader<Uint8Array>,
  ): Promise<void> => {
    if (!body || cancelledBodies.has(body)) return Promise.resolve();
    cancelledBodies.add(body);
    try {
      return Promise.resolve(reader ? reader.cancel() : body.cancel()).catch(() => undefined);
    } catch {
      return Promise.resolve();
    }
  };

  const dispose = () => {
    retired = true;
    timer?.cancel();
    externalSignal.removeEventListener('abort', onAbort);
  };

  const api: HttpOperation<TCause> = {
    get signal() {
      return controller.signal;
    },
    get terminal() {
      return terminal;
    },
    stop,
    checkDeadline,
    throwIfStopped() {
      checkDeadline();
      if (terminal !== undefined) throw terminal;
    },
    race(input) {
      checkDeadline();
      // Observe even an already stopped input to avoid an unhandled late rejection.
      const pending = Promise.resolve(input);
      pending.catch(() => undefined);
      if (terminal !== undefined) return Promise.reject(terminal);
      return Promise.race([pending, terminalPromise]);
    },
    raceFetch(input) {
      return api.race(input.then((response) => {
        checkDeadline();
        if (retired || terminal !== undefined) void cancel(response.body);
        return response;
      }));
    },
    cancelBody: (body) => cancel(body),
    cancelReader: (body, reader) => cancel(body, reader),
    cancelResponse: (response) => api.race(cancel(response.body)),
    dispose,
    [Symbol.dispose]: dispose,
  };
  return api;
}
