import type { t } from '../common.ts';

/**
 * Structural and exactness helpers for compile-time schema drift checks.
 * Usage:
 *   type _Lock = Expect<CheckSchemaExact<typeof MySchema, MyPublicType>>;
 */

/**
 * Basic equality check (bi-directional assignability).
 */
export type Equal<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

/**
 * Deep exactness: ensures no extra or missing keys.
 */
export type Exact<A, B> = A extends B
  ? Exclude<keyof A, keyof B> extends never
    ? Exclude<keyof B, keyof A> extends never
      ? true
      : false
    : false
  : false;

/**
 * Fails compilation when argument is not `true`.
 * Acts as a type-level `assert`.
 */
export type Expect<T extends true> = T;

type IsAny<T> = 0 extends 1 & T ? true : false;
type IsNever<T> = [T] extends [never] ? true : false;

/*───────────────────────────────────────────────────────────────────────────────*
 *  Schema checks (boolean return types for Expect<...> assertions)
 *───────────────────────────────────────────────────────────────────────────────*/

/**
 * Ensures schema inference is concrete — not `any`, `unknown`, or `never`.
 */
export type CheckSchemaConcrete<S extends t.TSchema> =
  Equal<IsAny<t.Infer<S>>, false> extends true
    ? Equal<Equal<t.Infer<S>, unknown>, false> extends true
      ? Equal<IsNever<t.Infer<S>>, false>
      : false
    : false;

/**
 * Ensures schema keys exactly match public type keys
 * (catches renames, omissions, or extras).
 */
export type CheckSchemaKeys<S extends t.TSchema, Public> = Equal<keyof t.Infer<S>, keyof Public>;

/**
 * Ensures full structural equality between schema inference and public type
 * (order-insensitive, no extra or missing fields).
 */
export type CheckSchemaExact<S extends t.TSchema, Public> = Exact<t.Infer<S>, Public>;
