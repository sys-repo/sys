/**
 * Internal inferred types from local schemas.
 *
 * ⚠️ Not exported from the public API:
 *    JSR rejects publishing "slow types". Consumers should
 *    re-infer from the schemas (e.g. `t.Static<typeof FooSchema>`).
 */
import type { t } from './common.ts';
import { SlugMinimalSchema, SlugRefSchema, SlugWithDataSchema } from './schema.slug/mod.ts';

/**
 * Slug (Core):
 */

/** Canonical Slug types inferred from schema variants. */
export type SlugRef = t.Infer<typeof SlugRefSchema>;
export type SlugMinimal = t.Infer<typeof SlugMinimalSchema>;
export type SlugWithData = t.Infer<typeof SlugWithDataSchema>;

/** Canonical slug union type. */
export type SlugCanonical = SlugRef | SlugMinimal | SlugWithData;
/** Convenience alias for callers. */
export type Slug = SlugCanonical;
