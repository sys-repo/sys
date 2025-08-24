import type { t } from './common.ts';
export type * from './t.validate.ts';

/**
 * Public surface for the factory-aware schema helpers.
 */
export type SchemaLib = {
  /** Property related schema helpers. */
  readonly Props: t.SchemaPropsLib;

  /** Schema utilities (runtime extraction). */
  readonly Schemas: t.SchemasUtilLib;

  /** Create a validator from a JSON schema */
  readonly makeValidator: t.ValidatorFactory;
};

/**
 * Public surface for the factory-aware "property" related schema helpers.
 */
export type SchemaPropsLib = {
  /**
   * Convenience: build a `{ [id]: Validator }` map from your registrations'
   * `spec.schema` fields (if present). Skips ids with no schema.
   */
  readonly makeValidators: <Id extends string>(
    regs: ReadonlyArray<t.Registration<Id, t.SlotId, unknown>>,
  ) => t.PropsValidators<Id>;

  /**
   * Validate props for a specific view id using a prebuilt map.
   * If there is no validator for the id, returns { ok:true } by design.
   */
  readonly validate: <Id extends string>(
    id: Id,
    props: unknown,
    validators: t.PropsValidators<Id>,
  ) => t.ValidateResult;
};

/**
 * Schema utilities (runtime extraction).
 */
export type SchemasUtilLib = {
};

/** Map of per-id schemas (only present when provided on the reg). */
export type SchemasMap<Id extends string> = Readonly<Partial<Record<Id, t.TSchema>>>;

/** Type-level inference helper. */
export type Infer<S extends t.TSchema> = t.Static<S>;
