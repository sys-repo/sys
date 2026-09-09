import type { t } from '../common.ts';
import type { ReadonlyRef, Ref } from './t.lens.ts';

/** Options to control how aggressively `Lens.toObject` dehydrates. */
export type ToObjectOptions = {
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
export type Unwrap<T> = T extends ReadonlyRef<infer _S, infer V> ? Unwrap<V>
  : T extends Ref<infer _S, infer V> ? Unwrap<V>
  : T extends readonly [...infer Elems] ? { readonly [K in keyof Elems]: Unwrap<Elems[K]> }
  : T extends readonly (infer U)[] ? readonly Unwrap<U>[]
  : t.IsPlainObject<T> extends true ? { readonly [K in keyof T]: Unwrap<T[K]> }
  : T;
