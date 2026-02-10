import { type t, Obj, Rx } from './common.ts';

type O = Record<string, unknown>;

/**
 * Bind a root immutable ref to a sub-path and expose an EffectRef-compatible surface.
 */
export function bindEffectRefPath<TRoot extends O, TState>(args: {
  readonly root: t.ImmutableRef<TRoot>;
  readonly path: t.ObjectPath;
  readonly initial?: () => TState;
}) {
  const { root, path, initial } = args;

  const api = {
    get current() {
      const current = Obj.Path.get<TState>(root.current, path);
      return ensureState(current, path, initial);
    },

    change(mutator: (draft: TState) => void) {
      root.change((draft) => {
        const current = Obj.Path.get<TState>(draft, path);
        const next = ensureState(current, path, initial);
        mutator(next);
        Obj.Path.Mutate.set(draft, path, next);
      });
    },

    events(until?: t.UntilInput) {
      const source = root.events(until).path(path).$;
      const getState = (value: O) => ensureState(Obj.Path.get<TState>(value, path), path, initial);
      const $ = source.pipe(Rx.map((e) => ({ ...e, after: getState(e.after) })));
      return { $ };
    },
  };

  return api;
}

function ensureState<T>(value: T | undefined, path: t.ObjectPath, initial?: () => T): T {
  if (value !== undefined) return value;
  if (initial) return initial();
  throw new Error(`Missing path-bound state at "${Obj.Path.encode(path)}".`);
}
