import type { t } from './common.ts';
import type * as TLens from '../m.Obj.Lens/t.ts';
import type * as TLensIs from '../m.Obj.Lens/t.is.ts';
import type * as TPath from '../m.Obj.Path/t.ts';
import type * as TPathCodec from '../m.Obj.Path/t.codec.ts';
import type * as TPathCurried from '../m.Obj.Path/t.curried.ts';
import type * as TPathIs from '../m.Obj.Path/t.is.ts';
import type * as TPathRel from '../m.Obj.Path/t.rel.ts';

type O = Record<string, unknown>;

/** An object extended with additional properties. */
export type ObjExtend<T extends object, U extends object> = T & U;

/**
 * Object utilities and subordinate object-domain type surfaces.
 */
export declare namespace Obj {
  /** Tools for working with objects. */
  export type Lib = {
    /** Tools for working with objects via abstract path arrays. */
    readonly Path: t.Obj.Path.Lib;
    /** Tools for working with "view/window" lenses into Object via paths. */
    readonly Lens: t.Obj.Lens.Lib;

    /**
     * Deeply freeze a trusted, caller-owned graph of primitive leaves, ordinary base arrays, and
     * realm-local plain objects, returning the same root with a deeply `readonly` type.
     *
     * The complete graph is validated before mutable nodes are frozen. Cycles, shared references,
     * cross-realm base arrays, null-prototype objects, and non-enumerable string-keyed data
     * properties are supported. Array subclasses, own symbol keys, accessors, functions, bigint or
     * symbol leaves, and non-plain objects are rejected.
     *
     * This operation does not clone. A pre-existing mutable alias retains its mutable static type
     * even though the aliased runtime graph becomes frozen. Runtime authority is captured when the
     * module evaluates, so later ambient replacement cannot redirect the operation. Proxies,
     * deliberately forged prototype chains, and realms compromised before module evaluation are
     * outside this primitive's trust boundary.
     *
     * @throws {TypeError} When the reachable graph is outside the supported plain-data contract.
     */
    deepFreeze<const T extends t.JsonLikeU>(input: T): t.DeepReadonly<T>;

    /** Instance equality check. */
    eql: (a: unknown, b: unknown) => boolean;

    /**
     * Walks an object tree (recursive descent) implementing
     * a visitor callback for each item.
     */
    walk<T extends object | unknown[]>(parent: T, fn: t.ObjWalkFn): void;

    /**
     * Converts an object into an array of {key,value} pairs.
     */
    toArray<T = O, K = keyof T>(obj: Record<string, unknown>): { key: K; value: T[keyof T] }[];

    /**
     * Walk the tree and ensure all strings are less than the given max-length.
     * - Returns `T` when an object is provided.
     * - Returns `undefined` when no object is provided.
     */
    truncateStrings: {
      // object → object
      <T extends Record<string, unknown>>(
        obj: T,
        options?: t.ObjTruncateStringsOptions | number,
      ): T;

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

    /** Determine whether an object owns the given property key. */
    hasOwn<K extends PropertyKey>(input: unknown, key: K): input is Record<K, unknown>;

    /**
     * Typed variant of native `Object.entries` that preserves key/value relationships.
     *
     * NOTE:
     * This is a *type assertion* (the platform typing loses key/value correlation).
     * Use for static/known-shape objects (e.g. `as const` registries, config maps),
     * not for untrusted or mutation-heavy dictionaries.
     */
    entries<T extends Record<string, unknown>>(
      obj: T,
    ): readonly (readonly [keyof T, T[keyof T]])[];

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
     * with support for Date, RegExp, and dynamic getter/setter preservation.
     */
    clone<T>(obj: T): T;

    /**
     * Deeply clones and extends the given object with a set of extra properties.
     */
    extend<T extends object, U extends object>(src: T, extra: U): ObjExtend<T, U>;

    /**
     * Convert the value to a simple number-hash.
     * "fast, consistent, unique hashCode" on arbitrary JS value objects.
     */
    hash<T>(value: T): number;

    /** Determine if the given input is typeof {object} and not Null. */
    isObject(input?: unknown): input is object;
    /** Determine if the given input is a simple {key:value} record object. */
    isRecord<T extends O>(input?: unknown): input is T;
    /** Determine if the given object is empty of all fields. */
    isEmptyRecord<T extends O>(input?: unknown): input is T;
  };

  /**
   * Object-path helpers and related path-domain types.
   */
  export namespace Path {
    /** Tools for working with objects via abstract path arrays. */
    export type Lib = TPath.Lib;

    /** Options controlling how a path string is sanitized before decoding. */
    export type SanitizeOptions = TPath.SanitizeOptions;

    /** String-level repair kind applied by path sanitizers. */
    export type Fix = TPath.Fix;

    /** Options for tolerant path decoding. */
    export type TryDecodeOptions = TPath.TryDecodeOptions;

    /** Structured result returned from tolerant path decoding. */
    export type TryDecodeResult = TPath.TryDecodeResult;

    /**
     * Predicates over object-paths.
     */
    export namespace Is {
      /** Predicates over object-paths. */
      export type Lib = TPathIs.Lib;
    }

    /**
     * Relationship helpers for comparing object paths.
     */
    export namespace Rel {
      /** Utilities for determining relationships between object-paths. */
      export type Lib = TPathRel.Lib;

      /** Relationship between two object paths. */
      export type Relation = TPathRel.Relation;
    }

    /**
     * Object-path codec definitions and options.
     */
    export namespace Codec {
      /** Collection of codecs (pointer, dot, etc). */
      export type Lib = TPathCodec.Lib;

      /** Object path encoder/decoder definition. */
      export type Definition = TPathCodec.Definition;

      /** Built-in object path codec kind. */
      export type Kind = TPathCodec.Kind;

      /** Options for namespace-level path encoding. */
      export type EncodeOptions = TPathCodec.EncodeOptions;

      /** Options for namespace-level path decoding. */
      export type DecodeOptions = TPathCodec.DecodeOptions;
    }

    /**
     * Curried object-path type surface.
     */
    export namespace Curried {
      /** Curried object-path wrapper API. */
      export type Lib = TPathCurried.Lib;

      /** Instance API for a single curried object path. */
      export type Instance<T = unknown> = TPathCurried.Instance<T>;
    }

    /**
     * Object-path mutation and diff type surface.
     */
    export namespace Mutate {
      /** Tools that mutate an object in-place using abstract path arrays. */
      export type Lib = TPath.Mutate.Lib;

      /** A JSON-serialisable description of one structural mutation. */
      export type Op = TPath.Mutate.Op;

      /** Options passed to object-path diff/mutation helpers. */
      export type Options = TPath.Mutate.Options;

      /** Aggregate result returned from object-path diff helpers. */
      export type Report = TPath.Mutate.Report;
    }
  }

  /**
   * Object lens helpers and related lens-domain types.
   */
  export namespace Lens {
    /** Tools for working with object lenses. */
    export type Lib = TLens.Lib;

    /** Unbound lens at a path. */
    export type Unbound<T = unknown> = TLens.Unbound<T>;

    /** Bound writable lens. */
    export type Ref<S extends O = O, T = unknown> = TLens.Ref<S, T>;

    /** Readonly unbound lens at a path. */
    export type ReadonlyUnbound<T = unknown> = TLens.ReadonlyUnbound<T>;

    /** Bound readonly lens. */
    export type ReadonlyRef<S extends O = O, T = unknown> = TLens.ReadonlyRef<S, T>;

    /** Options controlling lens-to-object dehydration. */
    export type ToObjectOptions = TLens.ToObjectOptions;

    /** Recursive lens-ref dehydration type. */
    export type Unwrap<T> = TLens.Unwrap<T>;

    /**
     * Guard checks for object lens values.
     */
    export namespace Is {
      /** Guard checks on value types. */
      export type Lib = TLensIs.Lib;
    }
  }
}

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

/** Options passed to the `Obj.truncateStrings` method. */
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
