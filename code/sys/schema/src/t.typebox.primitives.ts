/**
 * @module
 * TypeBox schema primitives (core T* constructors).
 */
import type { TCyclic, TOptional, TReadonly, TSchema as TSchemaBase } from 'typebox';

/** Value Types: */
export type {
  TAny,
  TArray,
  TBoolean,
  TConstructor,
  TCyclic,
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
  TReadonly,
  TRecord,
  TRef,
  TReturnType,
  TString,
  TTemplateLiteral,
  TTuple,
  TUndefined,
  TUnion,
  TUnknown,
  TVoid,
} from 'typebox';

/** JSON Schema object surface exposed by @sys/schema consumers. */
export type TSchema = TSchemaBase & {
  readonly $schema?: string;
  readonly $id?: string;
  readonly title?: string;
  readonly description?: string;
  readonly default?: unknown;
  readonly examples?: unknown;
  readonly readOnly?: boolean;
  readonly writeOnly?: boolean;
  readonly type?: string;
  readonly properties?: { readonly [key: string]: TSchema };
  readonly items?: TSchema;
  readonly required?: readonly string[];
  readonly additionalProperties?: boolean | TSchema;
  readonly patternProperties?: { readonly [key: string]: TSchema };
  readonly $defs?: { readonly [key: string]: TSchema };
  readonly $ref?: string;
  readonly anyOf?: readonly TSchema[];
  readonly oneOf?: readonly TSchema[];
  readonly allOf?: readonly TSchema[];
};

/** Recursive schema type alias exposed by @sys/schema. */
export type TRecursive<Type extends TSchema = TSchema> = TCyclic;

/** Readonly optional schema modifier alias exposed by @sys/schema. */
export type TReadonlyOptional<Type extends TSchema = TSchema> = TReadonly<TOptional<Type>>;

/** Uint8Array schema surface exposed by @sys/schema. */
export type TUint8Array = TSchema & {
  readonly type: 'uint8array';
  readonly minByteLength?: number;
  readonly maxByteLength?: number;
};

/** Utility / Derived: */
export type { TOmit, TPartial, TPick, TRequired, TUnsafe } from 'typebox';
