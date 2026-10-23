/**
 * Recursively convert object fields and canonical array elements to readonly.
 *
 * Direct tuple types retain their structure. Custom properties intersected onto array containers
 * are projected to the canonical readonly element surface; model such metadata on a containing
 * object when it must remain visible. Projection distributes per union member, and equivalent
 * projected members are not promised to normalize to one exact type identity.
 *
 * Source: https://www.builder.io/blog/utility-types
 */
export type DeepReadonly<T> = T extends Primitive ? T
  : T extends readonly unknown[] ? DeepReadonlyArray<T>
  : DeepReadonlyShape<T>;

type Primitive = string | number | boolean | undefined | null;

/** Keep recursive open arrays lazy while mapping direct tuple structure homomorphically. */
type DeepReadonlyArray<T extends readonly unknown[]> = IsTuple<T> extends true
  ? DeepReadonlyShape<T>
  : ReadonlyArray<DeepReadonly<T[number]>>;

type DeepReadonlyShape<T> = { readonly [P in keyof T]: DeepReadonly<T[P]> };

/** Detect direct tuple metadata without treating decorated array containers as tuples. */
type IsTuple<T extends readonly unknown[]> = T extends readonly [...infer Elements]
  ? Exclude<keyof T, keyof Elements> extends never ? HasTupleShape<Elements> : false
  : false;

type HasTupleShape<T extends readonly unknown[]> = T extends readonly [] ? true
  : T extends readonly [...unknown[], unknown] ? true
  : Extract<keyof T, `${number}`> extends never ? false
  : true;

/**
 * Convert ReadOnly fields to be mutable (not ReadOnly)
 */
export type DeepMutable<T> = {
  -readonly [P in keyof T]: T[P] extends object ? DeepMutable<T[P]> : T[P];
};

/**
 * Convert ReadOnly fields to be mutable (shallow).
 *
 * Use when you need to temporarily attach/write to a readonly surface at a seam,
 * while keeping the public type readonly (eg. compound component wiring).
 *
 * Note: This only removes readonly at the top level. For deep conversion use `DeepMutable<T>`.
 */
export type Mutable<T> = { -readonly [P in keyof T]: T[P] };

/**
 * A version of <Partial> (optional) allowing an entire
 * tree hierarchy to be considered <Partial>.
 *
 * See:
 *    https://www.typescriptlang.org/docs/handbook/utility-types.html
 */
export type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>;
};
