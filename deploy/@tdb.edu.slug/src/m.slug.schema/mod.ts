import { type t } from './common.ts';

export * from './slug.SlugTree/mod.ts';
export * from './slug.Traits/mod.ts';

import { SlugTreeSchema as Tree } from './slug.SlugTree/mod.ts';
import { ManifestSchema as Manifest } from './slug.Manifest/mod.ts';
import { MediaCompositionSchema as MediaComposition } from './slug.MediaComposition/mod.ts';

/**
 * Slug schema surface for `@tdb/edu-slug`.
 *
 * Owns the **slug-specific** schemas that sit on top of the upstream wire schemas in `@sys/schema/wire/*`.
 * - Upstream (`@sys/schema/wire/*`) defines the canonical, cross-system wire formats (JSONSchema + parse/validate)
 *   for shared manifests (e.g. assets, playback) and other transport-level contracts.
 * - This module composes those upstream schemas with slug-domain constraints (traits, slug-tree, sequence authoring)
 *   and exposes one cohesive `SlugSchema` entry-point for tools and UI.
 *
 * Keeping the upstream wire schemas referenced here is intentional: it preserves a single source of truth for
 * wire-format validation while allowing slug-domain schema composition without duplicating or forking contracts.
 */
export const SlugSchema: t.SlugSchemaLib = {
  Tree,
  Manifest,
  MediaComposition,
};
