import { type t } from '../common';

type O = Record<string, unknown>;

/**
 * Helper API for interacting with the state mutation event-API.
 */
export function ContextState<T extends O>(args: { events: t.DevEvents; initial: T }) {
  const { events, initial } = args;

  let _current: T | undefined;
  events.state.changed$.subscribe((e) => (_current = (e.info.render.state ?? initial) as T));

  const state: t.DevCtxState<T> = {
    get current() {
      return _current ?? initial;
    },
    async change(mutate) {
      await events.state.change.fire(initial, mutate);
      return state.current;
    },
  };

  return state;
}
