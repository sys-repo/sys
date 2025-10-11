import { VideoPlayerPropsSchema, VideoRecorderPropsSchema } from '../schema.traits/mod.ts';
import type { t } from './common.ts';
import type { CatalogTraitId } from './m.ids.ts';
import { makeRegistry } from './u.ts';

const ENTRIES = [
  { id: 'video-player', propsSchema: VideoPlayerPropsSchema },
  { id: 'video-recorder', propsSchema: VideoRecorderPropsSchema },
] as const;

/**
 * Default trait registry.
 */
export const TraitRegistryDefault: t.TraitRegistry<CatalogTraitId> = makeRegistry(
  ENTRIES satisfies readonly t.TraitRegistryEntry<CatalogTraitId>[],
);
