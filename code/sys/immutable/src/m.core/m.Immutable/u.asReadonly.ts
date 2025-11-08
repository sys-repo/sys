import { type t } from './common.ts';

/**
 * Convert any immutable handle (mutable or readonly)
 * into its canonical readonly view.
 */
export function asReadonly<T>(input: T): t.AsReadonly<T> {
  const { current, instance, events } = input as any;
  return {
    current,
    instance,
    events: events?.bind?.(input) ?? throwNotImplemented,
  } as t.AsReadonly<T>;
}

/**
 * Helpers:
 */
function throwNotImplemented() {
  throw new Error('events() not implemented on readonly view');
}
