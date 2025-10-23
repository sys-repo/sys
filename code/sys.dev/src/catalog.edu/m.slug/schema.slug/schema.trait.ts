import { type t, Type as T } from './common.ts';
import { Pattern } from './u.Pattern.ts';

/**
 * Bind a trait type (id) to a local alias (as).
 * - `as` lets us have multiple instances of the same trait type.
 * - `id` selects the trait type from the registry/defs.
 */
export const TraitBindingSchema: t.TObject<{
  as: t.TString;
  id: t.TString;
}> = T.Object(
  {
    id: T.String({
      title: 'Binding id-ref.',
      ...Pattern.idPattern(),
    }),
    as: T.String({
      title: 'Property alias',
      ...Pattern.idPattern(),
    }),
  },
  { additionalProperties: false },
);

/**
 * Trait definition descriptor (catalog-level).
 * Concrete prop schemas live in a runtime registry (regs.ts).
 */
export const TraitDefSchema: t.TObject<{
  id: t.TString;
  props: t.TOptional<t.TUnknown>;
}> = T.Object(
  {
    id: T.String({ ...Pattern.idPattern() }),
    props: T.Optional(T.Unknown()),
  },
  { additionalProperties: false },
);
