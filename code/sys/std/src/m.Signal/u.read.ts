import { type t } from './common.ts';

/**
 * Read the current value from any readable signal abstraction.
 * Supports:
 *  - Plain values (T)
 *  - Getter functions (() => T)
 *  - Objects with a `.value` field (including Preact Signal<T>)
 * Returns `undefined` if input is undefined.
 */
export const read: t.SignalValueHelpersLib['read'] = <T>(
  input?: t.ReadableSignal<T>,
): T | undefined => {
  if (input === undefined) return undefined;
  if (typeof input === 'function') return (input as () => T)();
  if (input && typeof input === 'object' && 'value' in input) return (input as { value: T }).value;
  return input as T;
};
