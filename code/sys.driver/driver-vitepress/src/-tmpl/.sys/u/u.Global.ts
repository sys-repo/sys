import { type t, Immutable, slug } from './common.ts';

const defaultId = `default:${slug()}`;
const refs = new Map<string, t.GlobalStateImmutable>();

/**
 * Global state interface.
 */
export const Global = {
  /**
   * Retrieve an instance of the global state object.
   *
   * @param instance - Optional unique identifier for the global state instance.
   *                   If not provided, the default instance is returned.
   *                   No param is the equivalent of retrieving the "singlton" instance.
   *
   * @returns The global state instance corresponding to the provided identifier.
   */
  state(instance?: t.StringId): t.GlobalStateImmutable {
    const id = instance ?? defaultId;
    if (refs.has(id)) return refs.get(id)!;

    const model = Immutable.clonerRef<t.GlobalState>({ tmp: 0 });
    refs.set(id, model);
    return model;
  },
} as const;
