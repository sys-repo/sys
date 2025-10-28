import { type t } from './common.ts';
import { slugTreeNormalizer } from './schema.slug.tree.normalize.ts';

export { slugTreeNormalizer };

/**
 * Runtime map of schema-trait normalizers.
 * Must stay in lock-step with the declared surface `t.SchemaTraitNormalizers`.
 */
export const TraitNormalizers: t.SchemaTraitNormalizers = {
  'slug-tree': slugTreeNormalizer,
};
