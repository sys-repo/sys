import type { t } from './common.ts';

type O = Record<string, unknown>;

/** An object extended with additional properties. */
export type ObjExtend<T extends object, U extends object> = T & U;

/**
 * Tools for working with objects.
 */
export type ObjLib = {
  /** Tools for working with objects via abstract path arrays. */
  readonly Path: t.ObjPathLib;
  /** Tools for working with "view/window" lenses into Object via paths. */
  readonly Lens: t.ObjLensLib;

  /** Instance equality check. */
  eql: t.RLib['equals'];

  /**
   * Walks an object tree (recursive descent) implementing
   * a visitor callback for each item.
   */
  walk<T extends object | any[]>(parent: T, fn: t.ObjWalkFn): void;

  /**
   * Converts an object into an array of {key,value} pairs.
   */
  toArray<T = O, K = keyof T>(obj: Record<string, any>): { key: K; value: T[keyof T] }[];

  /**
   * Walk the tree and ensure all strings are less than the given max-length.
   * - Returns `T` when an object is provided.
   * - Returns `undefined` when no object is provided.
   */
  truncateStrings: {
    // object → object
    <T extends Record<string, unknown>>(obj: T, options?: t.ObjTruncateStringsOptions | number): T;

    // undefined → undefined
    (obj: undefined, options?: t.ObjTruncateStringsOptions | number): undefined;

    // T | undefined → T | undefined    ← handles optional chaining at call sites
    <T extends Record<string, unknown>>(
      obj: T | undefined,
      options?: t.ObjTruncateStringsOptions | number,
    ): T | undefined;
  };

  /**
   * Retrieve a new object containing only the given set of keys.
   */
  pick<T extends O>(subject: T, ...fields: (keyof T)[]): T;

  /**
   * Typed variant of the native [Object.keys].
   */
  keys<T extends object>(obj?: T): Array<keyof T>;

  /**
   * Typed variant of native `Object.entries` that preserves key/value relationships.
   *
   * NOTE:
   * This is a *type assertion* (the platform typing loses key/value correlation).
   * Use for static/known-shape objects (e.g. `as const` registries, config maps),
   * not for untrusted or mutation-heavy dictionaries.
   */
  entries<T extends object>(obj: T): readonly (readonly [keyof T, T[keyof T]])[];

  /**
   * Convert one or more properties on the given object into accessor
   * (getter-backed) properties that return their existing values.
   *
   * This is primarily useful for development ergonomics, allowing heavy
   * fields to be hidden behind getters so that console inspection does
   * not eagerly expand large nested structures.
   *
   * - When `keys` is omitted or `null`, all own enumerable keys are wrapped.
   * - When a single key or list of keys is provided, only those are wrapped.
   */
  asGetter: {
    // All fields, optional options.
    <T extends O>(obj: T, options?: t.ObjAsGetterOptions): T;

    // Specific fields, optional options.
    <T extends O, K extends keyof T>(
      obj: T,
      keys: K | readonly K[] | null,
      options?: t.ObjAsGetterOptions,
    ): T;
  };

  /**
   * Sort the keys of an object.
   */
  sortKeys<T extends O>(obj: T): T;

  /**
   * Deeply clone the given object (circular-reference safe)
   * with support for Date, RegExp, and dynamic getter/setter presevation.
   */
  clone<T>(obj: T): T;

  /**
   * Deeply clones and extends the given object with a set of extra properties.
   */
  extend<T extends object, U extends object>(src: T, extra: U): ObjExtend<T, U>;

  /**
   * Convert the value to a simple number-hash.
   * "fast, consistent, unique hashCode" on any JS value object.
   */
  hash<T>(value: T): number;

  /** Determine if the given input is typeof {object} and not Null. */
  isObject(input?: unknown): input is object;
  /** Determine if the given input is a simple {key:value} record object. */
  isRecord<T extends O>(input?: unknown): input is T;
  /** Determine if the given object is empty of all fields. */
  isEmptyRecord<T extends O>(input?: unknown): input is T;
};

/** A callback passed to the `Obj.walk` callback function. */
export type ObjWalkFn = (e: ObjWalkFnArgs) => void;
/** Arguments passed to the `Obj.walk` callback. */
export type ObjWalkFnArgs = {
  readonly parent: object | readonly unknown[] | unknown;
  readonly path: t.ObjectPath;
  readonly key: string | number;
  readonly value: unknown;
  stop(): void;
  mutate<T>(value: T): void;
};

/** Options passed to the `Obj.trimStringsDeep` method. */
export type ObjTruncateStringsOptions = {
  maxLength?: number;
  ellipsis?: boolean;
  mutate?: boolean;
  /**
   * Maximum object/array nesting depth to traverse.
   * - `0`  → only inspect `obj` itself (no traversal into children).
   * - `1`  → inspect direct properties of `obj` (one level deep).
   * - `2+` → keep recursing up to that many levels.
   * - `undefined` → no depth limit (default).
   */
  maxDepth?: number;
};

/**
 * Options controlling how accessor properties created by `Obj.asGetter`
 * are defined on the target object.
 *
 * These map directly onto the standard JavaScript accessor descriptor flags.
 */
export type ObjAsGetterOptions = {
  readonly enumerable?: boolean;
  readonly configurable?: boolean;
};
