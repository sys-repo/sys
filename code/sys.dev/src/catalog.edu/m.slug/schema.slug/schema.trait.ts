import { type t, Type as T } from './common.ts';
import { Pattern } from './u.Pattern.ts';

/**
 * Bind a trait type ("of") to a local alias ("as").
 * - "of" selects the trait's type from the registry/defs.
 * - "as" lets us have multiple instances of the same trait type.
 */
export const TraitBindingSchema: t.TObject<{
  of: t.TString;
  as: t.TString;
}> = T.Object(
  {
    of: T.String({
      title: `Trait type reference.`,
      ...Pattern.idPattern(),
    }),
    as: T.String({
      title: `Local alias path address for this trait's instance data.`,
      ...Pattern.idPattern(),
    }),
  },
  { additionalProperties: false },
);

/**
 * Trait definition descriptor (root catalog-level).
 * Concrete prop schemas live in a runtime registry (eg. `regs.ts`).
 */
export const TraitDefSchema: t.TObject<{
  id: t.TString;
  props: t.TOptional<t.TUnknown>;
}> = T.Object(
  {
    id: T.String({
      title: 'Trait identifier.',
      ...Pattern.idPattern(),
    }),
    props: T.Optional(
      T.Unknown({
        title: 'Property data',
      }),
    ),
  },
  { additionalProperties: false },
);
