import { type t } from './common.ts';

type T = t.AppSignals['props']['stack'];

/**
 * Wrap the given signal with the [Stack] API.
 */
export function createStack(signal: T): t.AppSignalsStack {
  const api: t.AppSignalsStack = {
    get length() {
      return signal.value.length;
    },
    get items() {
      return [...signal.value];
    },
    push(...content) {
      const next = [...signal.value, ...content].filter(Boolean);
      signal.value = next as t.Content[];
    },
    pop(leave = 0) {
      const stack = signal;
      if (stack.value.length > leave) stack.value = stack.value.slice(0, -1);
    },
    clear(leave = 0) {
      signal.value = signal.value.slice(0, leave);
    },
  };
  return api;
}
