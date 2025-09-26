import { type t, Rx } from './common.ts';

/**
 * Read the "_instance" hidden ID from the bus.
 */
export function instance(bus?: t.EventBus<any>) {
  return ((bus ?? {}) as any)._instance ?? '';
}

/**
 * Convert a bus of one type into another type.
 */
export function busAsType<E extends t.Event>(bus: t.EventBus<any>) {
  return bus as t.EventBus<E>;
}

/**
 * Determine if the given object in an [EventBus].
 */
export function isBus(input: any) {
  if (typeof input !== 'object' || input === null) return false;
  return Rx.Is.observable(input.$) && typeof input.fire === 'function';
}

/**
 * Determine if the given object is an observable.
 */
export function isObservable<T = any>(input?: any): input is t.Observable<T> {
  return Rx.Is.observable<T>(input);
}
