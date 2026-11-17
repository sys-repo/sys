import { Is } from '../common.ts';
import type { SignalComposition } from './t.ts';

type Listener = { readonly signal: AbortSignal; readonly onAbort: () => void };

/** Compose abort signals while preserving first-cause authority. */
export function composeSignals(...signals: Array<AbortSignal | undefined>): SignalComposition {
  const active = signals.filter(Is.abortSignal);
  if (active.length <= 1) return { signal: active[0], dispose: () => {} };

  const controller = new AbortController();
  const listeners: Listener[] = [];
  const dispose = () => releaseListeners(listeners);
  const abort = (signal: AbortSignal) => {
    if (!controller.signal.aborted) controller.abort(signal.reason);
  };

  try {
    for (const signal of active) {
      const onAbort = () => abort(signal);
      // Register ownership first: a foreign add may attach and then throw.
      listeners.push({ signal, onAbort });
      signal.addEventListener('abort', onAbort, { once: true });
    }
    for (const signal of active) {
      if (signal.aborted) {
        abort(signal);
        break;
      }
    }
    return { signal: controller.signal, dispose };
  } catch (cause) {
    dispose();
    throw cause;
  }
}

/** Drain ownership before callbacks so repeated or reentrant cleanup cannot detach twice. */
function releaseListeners(listeners: Listener[]): void {
  for (const { signal, onAbort } of listeners.splice(0)) {
    try {
      signal.removeEventListener('abort', onAbort);
    } catch {
      // One foreign cleanup failure must not strand the remaining listeners or replace settlement.
    }
  }
}
