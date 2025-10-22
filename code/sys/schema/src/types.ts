/**
 * @module
 * @types Type-library module.
 */
import type { t } from './common.ts';

/**
 * Library:
 */
export type * from './m.Schema/t.ts';
export type * from './t.typebox.ts';

/** Type-level inference helper. */
export type Infer<S extends t.TSchema> = t.Static<S>;

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
}
export type * from './m.testing/t.ts';
