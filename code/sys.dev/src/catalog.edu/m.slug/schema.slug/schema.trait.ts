/**
 * @module schema.trait
 * Precise internal schemas + widened public exports for trait bindings/defs.
 *
 * Pattern:
 * • Use `*Internal` for precise composition and static-type recovery.
 * • Re-export widened `t.TSchema` symbols for public API/JSR safety.
 */
import { type t, Type as T } from './common.ts';
import { Pattern } from './m.Pattern.ts';

/**
 * Bind a trait type ("of") to a local alias ("as").
 * - "of" selects the trait's type from the registry/defs.
 * - "as" lets us have multiple instances of the same trait type.
 */
export const TraitBindingSchemaInternal = T.Object(
  {
    of: T.String({ title: 'Trait type reference', ...Pattern.idPattern() }),
    as: T.String({
      title: `Local alias path address for this trait's instance data`,
      ...Pattern.idPattern(),
    }),
  },
  { additionalProperties: false },
);

/**
 * Trait definition descriptor (root catalog-level).
 * Concrete prop schemas live in a runtime registry (eg. `regs.ts`).
 */
export const TraitDefSchemaInternal = T.Object(
  {
    id: T.String({ title: 'Trait type identifier', ...Pattern.idPattern() }),
    data: T.Optional(T.Unknown({ title: 'Serialized instance data for this trait' })),
  },
  { additionalProperties: false },
);

/**
 * Public widened exports (JSR-safe: explicit t.TSchema surface).
 */
export const TraitBindingSchema: t.TSchema = TraitBindingSchemaInternal;
export const TraitDefSchema: t.TSchema = TraitDefSchemaInternal;
