import { type t, Lens, Obj, Rx } from './common.ts';

type O = Record<string, unknown>;

export const bind: t.PathRefLib['bind'] = (args) => {
  const { root, initial } = args;
  const path = Obj.Path.joinAll(args.path ?? []);
  const lens = Lens.at(root, path);

  const api: t.PathRef<any, any, any> = {
    root,
    path,

    get current() {
      return ensureState(lens.get(), path, initial);
    },

    change(mutator) {
      lens.update((curr) => {
        const next = ensureState(curr, path, initial);
        mutator(next);
        return next;
      });
    },

    events(until) {
      const map = (v: O) => ({ after: ensureState(Obj.Path.get(v, path), path, initial) });
      const $ = root
        .events(until)
        .path(path)
        .$.pipe(Rx.map((e) => map(e.after)));
      return { $ };
    },
  };

  return api;
};

/**
 * Helpers
 */
function ensureState<T>(value: T | undefined, path: t.ObjectPath, initial?: () => T): T {
  if (value !== undefined) return value;
  if (initial) return initial();
  throw new Error(`Missing path-bound state at "${Obj.Path.encode(path)}".`);
}
