import { Is } from '../common.ts';

/** Compose abort signals while preserving first-cause authority. */
export function composeSignals(...signals: Array<AbortSignal | undefined>) {
  const active = signals.filter(Is.abortSignal);
  if (active.length <= 1) return { signal: active[0], dispose: () => {} };

  const controller = new AbortController();
  const abort = (signal: AbortSignal) => {
    if (!controller.signal.aborted) controller.abort(signal.reason);
  };
  const listeners = active.map((signal) => {
    const onAbort = () => abort(signal);
    signal.addEventListener('abort', onAbort, { once: true });
    return { signal, onAbort };
  });

  for (const signal of active) {
    if (signal.aborted) {
      abort(signal);
      break;
    }
  }

  const dispose = () => {
    listeners.forEach(({ signal, onAbort }) => signal.removeEventListener('abort', onAbort));
  };
  return { signal: controller.signal, dispose };
}
