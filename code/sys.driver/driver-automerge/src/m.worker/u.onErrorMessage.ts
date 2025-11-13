import { type t } from './common.ts';
import { Wire } from './u.evt.wire.ts';

/**
 * Observes MessagePort "messageerror" events.
 *   Emits a wire-level {type:'stream/error'} event for diagnostics and
 *   disposes the lifecycle after repeated faults (circuit breaker).
 */
export function onMessageErrorHandler(
  port: MessagePort,
  _repo: t.CrdtRepo,
  send: (evt: t.WireEvent) => void,
  life: t.Abortable,
) {
  let errCount = 0;
  let firstErrAt = 0;

  const MAX_ERRORS = 3; //            escalate after 3 errors...
  const WINDOW: t.Msecs = 10_000; //  ...within 10 seconds

  const onError = (e: Event) => {
    const now = Date.now();
    if (!firstErrAt || now - firstErrAt > WINDOW) {
      firstErrAt = now;
      errCount = 0;
    }

    errCount += 1;
    const data = wrangle.messageData(e as MessageEvent<unknown>);
    const message = data ? `messageerror: ${data}` : 'messageerror';
    const payload = Wire.event(Wire.Kind.repo, { type: 'stream/error', payload: { message } });
    send(payload);

    if (errCount >= MAX_ERRORS) life.dispose();
  };

  port.addEventListener?.('messageerror', onError, { signal: life.signal });
}

/**
 * Helpers:
 */
const wrangle = {
  messageData(e: MessageEvent<unknown>) {
    return typeof e?.data === 'string'
      ? e.data
      : e?.data != null
        ? Object.prototype.toString.call(e.data)
        : '';
  },
} as const;
