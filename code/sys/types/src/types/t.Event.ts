type O = Record<string, unknown>;

/**
 * The canonical event structure.
 */
export type Event<P extends O = O> = { type: string; payload: P };

/**
 * A function that can fire an event through a bus.
 */
export type FireEvent<E extends Event = Event> = (event: E) => void;
