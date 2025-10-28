import {
  SlugIndexPropsSchema,
  SlugTreePropsSchema,
  VideoPlayerPropsSchema,
  VideoRecorderPropsSchema,
} from '../schema.traits/mod.ts';
import { type t, makeRegistry } from './common.ts';
import type { CatalogTraitId } from './m.ids.ts';

const ENTRIES = [
  { id: 'slug-index', propsSchema: SlugIndexPropsSchema },
  { id: 'slug-tree', propsSchema: SlugTreePropsSchema },
  { id: 'video-player', propsSchema: VideoPlayerPropsSchema },
  { id: 'video-recorder', propsSchema: VideoRecorderPropsSchema },
] satisfies readonly t.SlugTraitRegistryEntry<CatalogTraitId>[];

/**
 * Default trait registry.
 */
export const TraitRegistryDefault: t.SlugTraitRegistry<CatalogTraitId> = makeRegistry(ENTRIES);
