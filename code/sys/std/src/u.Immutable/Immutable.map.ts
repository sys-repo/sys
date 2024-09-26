import { Delete, ObjectPath, R, Symbols, rx, slug, type t } from './common.ts';
import { viaObservable } from './Immutable.events.ts';
import { Is, Wrangle, toObject } from './u.ts';

type K = string | symbol;
type O = Record<string, unknown>;

const Mutate = ObjectPath.Mutate;

/**
 * Tools for creating composite objects.
 */
export const Map: t.ImmutableMapLib = {
  toObject,

  /**
   * Create a new composite proxy that maps to an underlying document(s).
   */
  create<T extends O, P = t.ImmutableMapPatchDefault>(
    mapping: t.ImmutableMapping<T, P>,
    options: { formatPatch?: t.ImmutableMapFormatPatch<P> } = {},
  ) {
    const { formatPatch } = options;
    const $ = rx.subject<t.ImmutableChange<T, P>>();
    const deduped$ = $.pipe(rx.distinctWhile((prev, next) => R.equals(prev.after, next.after)));
    const next = (e: t.ImmutableChange<T, P>) => $.next(wrangle.formatChange(e));

    type C = t.ImmutablePatchCallback<P>;
    let _callback: C | undefined;

    /**
     * Proxy
     */
    const initial = wrangle.initial(mapping);
    const get = (key: K) => {
      const prop = wrangle.prop(mapping, key);
      return prop ? ObjectPath.resolve(prop.doc.current, prop.path) : undefined;
    };
    const proxy = new Proxy(initial, {
      get(_, key) {
        return get(key);
      },
      set(_, key, value) {
        const prop = wrangle.prop(mapping, key);
        if (prop) {
          const callback: C = (patches) => {
            const formatted = wrangle.patches(patches, prop.key, prop.doc, formatPatch);
            _callback?.(formatted);
          };
          prop.doc.change((d) => Mutate.value(d, prop.path, value), callback as any);
        }
        return true;
      },

      ownKeys(_) {
        return Reflect.ownKeys(_);
      },
      getOwnPropertyDescriptor(_, key) {
        return {
          configurable: true,
          enumerable: true,
          writable: false,
          value: get(key),
        };
      },
    });

    /**
     * Internal API for the app.
     */
    const internal: t.ImmutableMapInternal<T, P> = {
      mapping: mapping,
      origin(key) {
        const prop = wrangle.prop(mapping, key);
        if (!prop) return undefined;
        if (!Is.map(prop.doc)) return prop;

        const mapped = Map.internal(prop.doc);
        if (!mapped) return undefined;

        const match = Object.keys(mapped.mapping)
          .map((key) => wrangle.prop(mapped.mapping, key)!)
          .filter(Boolean)
          .find((p) => {
            type P = t.ImmutableMappingArray<O, unknown>;
            const path = ObjectPath.from(p.key);
            const prop = wrangle.propFromArray(p.key, ObjectPath.resolve<P>(mapped.mapping, path));
            return prop ? p?.doc === prop?.doc : false;
          });

        if (!match) return undefined;
        return mapped.origin(match.key) as t.ImmutableMappingProp<T, P>; // ← RECURSION 🌳
      },
    };

    /**
     * API
     */
    const api: t.ImmutableMap<T, P> = {
      instance: slug(),

      [Symbols.map.root]: true,
      get [Symbols.map.internal]() {
        return internal;
      },

      get current() {
        return proxy as T;
      },

      change(fn, options) {
        const callback = Wrangle.options(options).patches;
        const patches: P[] = [];

        _callback = (e) => patches.push(...e);
        fn(proxy);
        _callback = undefined;

        callback?.(patches);
      },

      events(until$?: t.UntilObservable) {
        const events = viaObservable<T, P>(deduped$, until$);
        const dispose$ = events.dispose$;
        monitorSourceChanges<T, P>(api, { next, formatPatch, dispose$ });
        return events as t.ImmutableEvents<T, P>;
      },

      toObject() {
        return toObject(proxy);
      },
    };
    return api;
  },

  /**
   * Retrieve the internal API
   */
  internal<T extends O, P>(
    input: t.ImmutableRef<T, P> | t.ImmutableMap<T, P>,
  ): t.ImmutableMapInternal<T, P> | undefined {
    return Is.map(input) ? (input as any)[Symbols.map.internal] : undefined;
  },
} as const;

/**
 * Helpers
 */
const wrangle = {
  initial(map: t.ImmutableMapping<any, any>) {
    const initial = Object.keys(map).reduce((acc: any, key) => {
      const prop = wrangle.prop(map, key);
      acc[key] = Symbol(`map → ${prop?.path.join('/') ?? 'UNKNOWN'}`);
      return acc;
    }, {});
    initial[Symbols.map.proxy] = true;
    return initial;
  },

  prop<T extends O, P>(map: t.ImmutableMapping<T, P>, key: string | symbol) {
    return wrangle.propFromArray(key, map[key as any]);
  },

  propFromArray<T extends O, P>(
    key: string | symbol,
    item?: t.ImmutableMappingArray<T, P>,
  ): t.ImmutableMappingProp<T, P> | undefined {
    if (!Array.isArray(item)) return undefined;

    type E = t.ImmutableEvents<T, P>;
    const [doc, field] = item;
    const path = typeof field === 'string' ? [field] : field;
    if (!ObjectPath.Is.path(path) || !Is.immutableRef<T, P, E>(doc)) return undefined;
    return { key, doc, path } as const;
  },

  current<T extends O, P>(map: t.ImmutableMapping<T, P>, proxy: O): T {
    return Object.keys(map).reduce((acc, key) => {
      (acc as any)[key] = proxy[key];
      return acc;
    }, {} as T);
  },

  patch<P>(args: t.ImmutableMapFormatPatchArgs<P>): P {
    const doc = `instance:${args.doc.instance}`;
    const mapping: t.ImmutableMapPatchInfo = { doc, key: args.key };
    return { ...args.patch, mapping };
  },

  patches<P>(
    patches: P[],
    field: string | symbol,
    doc: t.ImmutableRef,
    formatter?: t.ImmutableMapFormatPatch<P>,
  ) {
    const format: t.ImmutableMapFormatPatch<P> = formatter ?? wrangle.patch;
    const key = String(field);
    return patches.map((patch) => format({ patch, key, doc }));
  },

  formatChange<T extends O, P>(e: t.ImmutableChange<T, P>) {
    const before = Delete.undefined(e.before);
    const after = Delete.undefined(e.after);
    return { ...e, before, after };
  },

  pluckAndMap<T extends O, P>(map: t.ImmutableMap<T, P>, subject: O, paths: t.ObjectPath[]): T {
    const proxy = map.current;
    const internal = Map.internal(map);
    if (!internal) throw new Error('[map] should have produced an internal API');

    const plucked = paths
      .filter((path) => ObjectPath.exists(subject, path))
      .reduce((acc, path) => {
        Mutate.value(acc, path, ObjectPath.resolve(subject, path));
        return acc;
      }, {});

    return Object.keys(internal.mapping)
      .map((key) => wrangle.prop(internal.mapping, key))
      .filter((prop) => !!prop)
      .reduce((acc, prop) => {
        const key = String(prop.key);
        const origin = internal?.origin(key);
        if (!origin) throw new Error(`[origin] mapping of key "${key}" not found.`);

        const pathExists = paths.some((p) => p.join() === origin.path.join());
        const value = pathExists ? ObjectPath.resolve(plucked, origin.path) : proxy[key];
        Mutate.value(acc, [key], value);
        return acc;
      }, {} as T);
  },
} as const;

/**
 * Sets up a monitor to listen for underlying changes in the source documents.
 */
function monitorSourceChanges<T extends O, P>(
  map: t.ImmutableMap<T, P>,
  args: {
    next: (payload: t.ImmutableChange<T, P>) => void;
    dispose$?: t.UntilObservable;
    formatPatch?: t.ImmutableMapFormatPatch<P>;
  },
) {
  const { next, dispose$, formatPatch } = args;
  const internal = Map.internal(map);
  if (!internal) throw new Error('[map] should have produced an internal API');

  const mapping = internal.mapping;
  Object.keys(mapping)
    .map((key) => wrangle.prop<T, P>(mapping, key)!)
    .map((prop) => ({ prop, origin: internal.origin(prop?.key)! }))
    .filter(({ prop, origin }) => !!prop && !!origin)
    .forEach(({ prop, origin }) => {
      const events = origin.doc.events(dispose$);
      events.changed$
        .pipe(rx.distinctWhile((prev, next) => R.equals(prev.after, next.after)))
        .subscribe((e) => {
          const paths = e.patches.map((p) => ObjectPath.from(p));
          if (paths.length > 0) {
            const before = wrangle.pluckAndMap(map, e.before, paths);
            const after = wrangle.pluckAndMap(map, e.after, paths);
            const patches = wrangle.patches(e.patches, prop.key, prop.doc, formatPatch);
            next({ before, after, patches });
          }
        });
    });
}
