/**
 * @module
 * TypeBox schema primitives (core T* constructors).
 */

/** Value Types: */
export type {
  TAny,
  TArray,
  TBoolean,
  TConstructor,
  TEnum,
  TFunction,
  TInteger,
  TIntersect,
  TKeyOf,
  TLiteral,
  TNever,
  TNull,
  TNumber,
  TObject,
  TOptional,
  TParameters,
  TPromise,
  TReadonly,
  TReadonlyOptional,
  TRecord,
  TRecursive,
  TRef,
  TReturnType,
  TSchema,
  TString,
  TTemplateLiteral,
  TTuple,
  TUint8Array,
  TUndefined,
  TUnion,
  TUnknown,
  TVoid,
} from '@sinclair/typebox';

/** Utility / Derived: */
export type { TOmit, TPartial, TPick, TRequired, TUnsafe } from '@sinclair/typebox';
