import type { t } from './common.ts';

/**
 * Schema common namespace:
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

  // Recipe (core grammar layer):
  export namespace Recipe {
    export type Recipe = t.Recipe;
    export type StrSpec = t.StrSpec;
    export type NumSpec = t.NumSpec;
    export type BoolSpec = t.BoolSpec;
    export type LitSpec = t.LitSpec;
    export type ArrSpec = t.ArrSpec;
    export type ObjSpec = t.ObjSpec;
    export type UnionSpec = t.UnionSpec;
    export type OptSpec = t.OptSpec;
  }
  // Root aliases for ergonomics (type-only)
  export type Spec = Recipe.Recipe;
  export type StrSpec = Recipe.StrSpec;
  export type NumSpec = Recipe.NumSpec;
  export type BoolSpec = Recipe.BoolSpec;
  export type LitSpec = Recipe.LitSpec;
  export type ArrSpec = Recipe.ArrSpec;
  export type ObjSpec = Recipe.ObjSpec;
  export type UnionSpec = Recipe.UnionSpec;
  export type OptSpec = Recipe.OptSpec;
}
