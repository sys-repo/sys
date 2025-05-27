import { createLens, rx, Symbols, toObject, type t } from './common.ts';

type O = Record<string, unknown>;
type Options<R extends O> = { dispose$?: t.UntilObservable; init?: t.InitializeLens<R> };

export const Namespace = {
  /**
   * Create a [Lens] namespace manager for (or within) the a root document.
   *
   * [Context]:
   *      This allows multiple lens to be created on a {map}
   *      object within the single document.
   */
  create<R extends O, N extends string = string>(
    root: t.Doc<R>,
    path?: t.ObjectPath | (() => t.ObjectPath),
    options?: Options<R> | t.InitializeLens<R>,
  ): t.NamespaceManager<N> {
    const args = wrangle.options(options);
    const events = root.events(args.dispose$);
    const { dispose, dispose$ } = events;

    const container = createLens<R, t.NamespaceMap<N>>(root, path, { init: args.init, dispose$ });
    const cache = new Map<N, t.Lens<O>>();
    dispose$.subscribe(() => cache.clear());

    /**
     * API
     */
    const api: t.NamespaceManager<N> = {
      get container() {
        type T = t.NamespaceMap<N>;
        if (api.disposed) return {} as T;
        const res = {} as T;
        Array.from(cache).forEach(([key, value]) => (res[key] = toObject(value.current)));
        return res;
      },

      list<L extends O>() {
        return Array.from(cache).map((item) => {
          const namespace = item[0] as N;
          const lens = item[1] as t.Lens<L>;
          return { namespace, lens };
        });
      },

      lens<L extends O>(namespace: N, initial: L) {
        if (cache.has(namespace)) return cache.get(namespace) as t.Lens<L>;

        // Ensure the namespace {object} exists.
        if (container.current[namespace] === undefined) {
          container.change((d) => (d[namespace] = initial));
        }

        // Construct the lens.
        const subpath = () => [...wrangle.path(path), namespace];
        const lens = createLens<R, L>(root, subpath, { dispose$ });
        lens.dispose$.pipe(rx.take(1)).subscribe(() => cache.delete(namespace));

        // Finish up.
        cache.set(namespace, lens);
        return lens;
      },

      events(dispose$?: t.UntilObservable) {
        return container.events(dispose$);
      },

      typed<T extends string>() {
        return api as unknown as t.NamespaceManager<T>;
      },

      /**
       * Lifecycle
       */
      dispose$,
      dispose,
      get disposed() {
        return events.disposed;
      },
    };

    (api as any)[Symbols.kind] = Symbols.Namespace;
    return api;
  },
} as const;

/**
 * Helpers
 */
const wrangle = {
  options<R extends O>(input?: Options<R> | t.InitializeLens<R>): Options<R> {
    if (typeof input === 'function') return { init: input };
    return input ?? {};
  },

  path(path?: t.ObjectPath | (() => t.ObjectPath)) {
    return typeof path === 'function' ? path() : path ?? [];
  },
} as const;
