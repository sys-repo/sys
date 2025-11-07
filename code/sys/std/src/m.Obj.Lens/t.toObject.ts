import type { t } from './common.ts';

/** Options to control how aggressively `Lens.toObject` dehydrates. */
export type LensToObjectOptions = {
  /** Max recursion depth (default: 32). */
  depth?: number;
  /** Include accessor (getter) properties. Default: false (skip). */
  includeGetters?: boolean;
};

/**
 * Recursively replaces lens refs with their `.get()` value types.
 * - Arrays recurse.
 * - Only "plain objects" recurse; non-plain objects are preserved as-is.
 */
export type UnwrapLenses<T> =
  T extends t.ReadOnlyObjLensRef<any, infer V>
    ? UnwrapLenses<V>
    : T extends t.ObjLensRef<any, infer V>
      ? UnwrapLenses<V>
      : T extends readonly [...infer Elems]
        ? { readonly [K in keyof Elems]: UnwrapLenses<Elems[K]> }
        : T extends readonly (infer U)[]
          ? readonly UnwrapLenses<U>[]
          : t.IsPlainObject<T> extends true
            ? { readonly [K in keyof T]: UnwrapLenses<T[K]> }
            : T;
