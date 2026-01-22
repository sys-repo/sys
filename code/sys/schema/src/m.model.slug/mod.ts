/**
 * @module
 * Slug content model schemas.
 *
 * Canonical runtime schemas for Slug domain content.
 * These schemas define the stable model shape used across authoring,
 * storage, transport, and execution boundaries.
 *
 * Validation enforces structural and semantic correctness of the model,
 * independent of how or where the data is transported.
 */
import type { t } from './common.ts';

import { ManifestSchema as Manifest } from './m.Manifest/mod.ts';
import { MediaCompositionSchema as MediaComposition } from './m.MediaComposition/mod.ts';
import { SlugTreeSchema as Tree } from './m.SlugTree/mod.ts';
import { TraitsSchema as Traits } from './m.Traits/mod.ts';

export const SlugSchema: t.SlugSchemaLib = {
  Tree,
  Manifest,
  MediaComposition,
  Traits,
};
