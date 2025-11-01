import type { t } from './common.ts';

/**
 * Schema common namespace.
 */
export namespace Schema {
  export type Infer<S extends t.TSchema> = t.Static<S>;

  // Values:
  export namespace Value {
    export type Error = t.ValueError;
  }

  // Validation parsing errors:
  export type Error = t.SchemaError;
  export type ValidationError = t.SchemaValidationError;
  export type YamlError = t.SchemaYamlError;

  /**
   * Spec — value-only grammar; compile to TSchema via toSchema.
   */
  export namespace Spec {
    export type Variant = t.SpecVariant; // The discriminated union of all spec types.
    export type Str = t.StrSpec;
    export type Num = t.NumSpec;
    export type Bool = t.BoolSpec;
    export type Lit = t.LitSpec;
    export type Arr = t.ArrSpec;
    export type Obj = t.ObjSpec;
    export type Union = t.UnionSpec;
    export type Opt = t.OptSpec;
  }
  export type SpecWith<T, K extends keyof T> = t.SpecWith<T, K>;
}
