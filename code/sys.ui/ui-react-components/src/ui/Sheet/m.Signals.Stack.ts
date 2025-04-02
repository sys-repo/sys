import { type t, Signal } from './common.ts';

/**
 * Wrap the given signal with the [Stack] API.
 */
export const createStack: t.SheetSignalsLib['stack'] = <T>(input?: t.Signal<T[]>) => {
  const signal = input ?? Signal.create<T[]>([]);

  const api: t.SheetSignalStack<T> = {
    get length() {
      return signal.value.length;
    },
    get items() {
      return [...signal.value];
    },

    push(...content) {
      const next = [...signal.value, ...content].filter(Boolean) as T[];
      signal.value = next;
    },
    pop(leave = 0) {
      const stack = signal;
      if (stack.value.length > leave) stack.value = stack.value.slice(0, -1);
    },
    clear(leave = 0) {
      signal.value = signal.value.slice(0, leave);
    },
    toSignal() {
      return signal;
    },
  };

  return api;
};
