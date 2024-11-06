import type { t } from './common.ts';
type O = Record<string, unknown>;

/**
 * The canonical event structure.
 */
export type Event<P extends O = O> = { type: string; payload: P };

/**
 * A function that can fire an event through a bus.
 */
export type FireEvent<E extends Event = Event> = (event: E) => void;

/**
 * A structure that exposes an observable and can fire events.
 */
export type EventBus<E extends Event = Event> = {
  readonly $: t.Observable<E>;
  fire: t.FireEvent<E>;
};
