/**
 * Type predicate at the type level:
 * Resolves to `true` for plain objects ({} or Object.create(null)),
 * and `false` for arrays, functions, Dates, Maps/Sets, WeakMaps/Sets, and class instances.
 */
export type IsPlainObject<T> = T extends object
  ? T extends Function
    ? false
    : T extends readonly any[]
      ? false
      : T extends Date | RegExp | Map<any, any> | Set<any> | WeakMap<object, any> | WeakSet<object>
        ? false
        : true
  : false;
