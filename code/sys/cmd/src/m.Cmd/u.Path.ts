import { type t, DEFAULTS, isObject, Obj } from './common.ts';
import type { CmdPathLib } from './t.ts';

type S = string;
type O = Record<string, unknown>;

/**
 * Helpers for resolving and mutating paths.
 */
export const Path: CmdPathLib = {
  wrangle(input?: t.CmdPaths | t.ObjectPath) {
    const DEF = DEFAULTS.paths;
    if (!input) return DEF;
    if (Array.isArray(input)) return Path.prepend(input);
    return typeof input === 'object' ? input : DEF;
  },

  resolver(input?: t.CmdPaths | t.ObjectPath) {
    const paths = Path.wrangle(input);

    const api: t.CmdResolver = {
      paths,
      queue: {
        /**
         * The array containing the list of invoked commands.
         */
        list<C extends t.CmdType>(d: O) {
          type T = t.CmdQueueItem<C>[];
          const get = () => Obj.Path.get<T>(d, paths.queue);
          if (!get()) Obj.Path.Mutate.set(d, paths.queue, []);
          return get()!;
        },

        /**
         * Retrieves a helper for working with a single item within the queue.
         */
        item<C extends t.CmdType>(d: O, index?: number) {
          const queue = api.queue.list<C>(d);
          const i = index ?? queue.length;
          const path = [...paths.queue, i];
          if (!queue[i]) Obj.Path.Mutate.set(d, path, {});

          const item: t.CmdResolverQueueItem = {
            index: i,
            path,

            name<N extends S = S>(defaultValue = '') {
              const name = [...path, 'name'];
              const get = () => Obj.Path.get<N>(d, name);
              if (!get()) Obj.Path.Mutate.set(d, name, defaultValue);
              return get()!;
            },

            params<P extends O = O>(defaultValue: P) {
              const params = [...path, 'params'];
              const get = () => Obj.Path.get<P>(d, params);
              if (!get()) Obj.Path.Mutate.set(d, params, defaultValue);
              return get()!;
            },

            error<E extends O = O>(defaultValue?: E) {
              const error = [...path, 'error'];
              const get = () => Obj.Path.get<E>(d, error);
              if (!get()) Obj.Path.Mutate.set(d, error, defaultValue);
              return get()!;
            },

            tx(defaultValue?: string) {
              const tx = [...path, 'tx'];
              const get = () => Obj.Path.get<string>(d, tx);
              if (!get()) Obj.Path.Mutate.set(d, tx, defaultValue ?? DEFAULTS.tx());
              return get()!;
            },

            id(defaultValue?: string) {
              const id = [...path, 'id'];
              const get = () => Obj.Path.get<string>(d, id);
              if (!get()) Obj.Path.Mutate.set(d, id, defaultValue ?? DEFAULTS.id());
              return get()!;
            },

            issuer(defaultValue?: string) {
              const issuer = [...path, 'issuer'];
              const get = () => Obj.Path.get<string>(d, issuer);
              if (!get()) Obj.Path.Mutate.set(d, issuer, defaultValue);
              return get()!;
            },
          } as const;

          return item;
        },
      },

      log(d: O) {
        type T = t.CmdLog;
        const path = paths.log;
        const get = () => Obj.Path.get<T>(d, path);
        if (!get()) Obj.Path.Mutate.set(d, path, DEFAULTS.log());
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
