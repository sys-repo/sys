/**
 * Internal inferred types from local schemas.
 *
 * ⚠️ Not exported from the public API:
 *    JSR rejects publishing "slow types". Consumers should
 *    re-infer from the schemas (e.g. `t.Static<typeof FooSchema>`).
 */
import type { t } from './common.ts';
import type { SchemaTraitId } from './m.slug.traits/schema.trait.registry/m.ids.ts';
import type { SlugSchema } from './m.slug/mod.ts';

/**
 * Slug (Core):
 */
export type * from './m.slug/t.inferred.ts';

/**
 * Slug decorated with semantic registry validation (internal use).
 */
export type SlugValidated = t.Infer<typeof SlugSchema> & {
  readonly registry: SchemaTraitId[];
};
