/**
 * Convert all fields ReadOnly (deep)
 * Source: https://www.builder.io/blog/utility-types
 */
export type DeepReadonly<T> = T extends Primitive
  ? T
  : T extends Array<infer U>
  ? DeepReadonlyArray<U>
  : DeepReadonlyObject<T>;

type Primitive = string | number | boolean | undefined | null;
interface DeepReadonlyArray<T> extends ReadonlyArray<DeepReadonly<T>> {}
type DeepReadonlyObject<T> = {
  readonly [P in keyof T]: DeepReadonly<T[P]>;
};

/**
 * Convert ReadOnly fields to be mutable (not ReadOnly)
 */
export type DeepMutable<T> = {
  -readonly [P in keyof T]: T[P] extends object ? DeepMutable<T[P]> : T[P];
};

/**
 * A version of <Partial> (optional) allowing an entire
 * tree hierarchy to be considered <Partial>.
 *
 * See:
 *    https://www.typescriptlang.org/docs/handbook/utility-types.html
 *
 */
export type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>;
};
