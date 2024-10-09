import { DEFAULTS, isObject, ObjectPath, type t } from './common.ts';

type S = string;
type O = Record<string, unknown>;

/**
 * Helpers for resolving and mutating paths.
 */
export const Path: t.CmdPathLib = {
  wrangle(input?: t.CmdPaths | t.ObjectPath) {
    const DEF = DEFAULTS.paths;
    if (!input) return DEF;
    if (Array.isArray(input)) return Path.prepend(input);
    return typeof input === 'object' ? input : DEF;
  },

  resolver(input?: t.CmdPaths | t.ObjectPath) {
    const paths = Path.wrangle(input);
    const resolve = ObjectPath.resolve;
    const Mutate = ObjectPath.Mutate;

    const api: t.CmdResolver = {
      paths,
      queue: {
        /**
         * The array containing the list of invoked commands.
         */
        list<C extends t.CmdType>(d: O) {
          type T = t.CmdQueueItem<C>[];
          const get = () => resolve<T>(d, paths.queue);
          if (!get()) Mutate.value(d, paths.queue, []);
          return get()!;
        },

        /**
         * Retrieves a helper for working with a single item within the queue.
         */
        item<C extends t.CmdType>(d: O, index?: number) {
          const queue = api.queue.list<C>(d);
          const i = index ?? queue.length;
          const path = [...paths.queue, i];
          if (!queue[i]) Mutate.value(d, path, {});

          const item: t.CmdResolverQueueItem = {
            index: i,
            path,

            name<N extends S = S>(defaultValue = '') {
              const name = [...path, 'name'];
              const get = () => resolve<N>(d, name);
              if (!get()) Mutate.value(d, name, defaultValue);
              return get()!;
            },

            params<P extends O = O>(defaultValue: P) {
              const params = [...path, 'params'];
              const get = () => resolve<P>(d, params);
              if (!get()) Mutate.value(d, params, defaultValue);
              return get()!;
            },

            error<E extends O = O>(defaultValue?: E) {
              const error = [...path, 'error'];
              const get = () => resolve<E>(d, error);
              if (!get()) Mutate.value(d, error, defaultValue);
              return get()!;
            },

            tx(defaultValue?: string) {
              const tx = [...path, 'tx'];
              const get = () => resolve<string>(d, tx);
              if (!get()) Mutate.value(d, tx, defaultValue ?? DEFAULTS.tx());
              return get()!;
            },

            id(defaultValue?: string) {
              const id = [...path, 'id'];
              const get = () => resolve<string>(d, id);
              if (!get()) Mutate.value(d, id, defaultValue ?? DEFAULTS.id());
              return get()!;
            },

            issuer(defaultValue?: string) {
              const issuer = [...path, 'issuer'];
              const get = () => resolve<string>(d, issuer);
              if (!get()) Mutate.value(d, issuer, defaultValue);
              return get()!;
            },
          } as const;

          return item;
        },
      },

      log(d: O) {
        type T = t.CmdLog;
        const path = paths.log;
        const get = () => resolve<T>(d, path);
        if (!get()) Mutate.value(d, path, DEFAULTS.log());
        return get()!;
      },

      toObject<C extends t.CmdType>(d: O): t.CmdObject<C> {
        return {
          queue: api.queue.list<C>(d),
          total: api.log(d),
        };
      },
    } as const;
    return api;
  },

  prepend(prefix: t.ObjectPath, paths: t.CmdPaths = DEFAULTS.paths): t.CmdPaths {
    return {
      queue: [...prefix, ...paths.queue],
      log: [...prefix, ...paths.log],
    };
  },

  /**
   * Flags
   */
  Is: {
    commandPaths(input: any): input is t.CmdPaths {
      if (!isObject(input)) return false;
      const o = input as t.CmdPaths;
      const is = Path.Is.stringArray;
      return is(o.queue);
    },

    stringArray(input: any): input is string[] {
      return Array.isArray(input) && input.every((v) => typeof v === 'string');
    },
  },
} as const;
