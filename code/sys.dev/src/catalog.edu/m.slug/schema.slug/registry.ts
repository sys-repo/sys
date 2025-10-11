import { VideoPlayerPropsSchema, VideoRecorderPropsSchema } from '../schema.slug.traits/mod.ts';
import type { t } from './common.ts';

/** Construct a simple in-memory registry. */
function makeRegistry(all: readonly t.TraitEntry[]): t.TraitRegistry {
  const map = new Map<t.TraitId, t.TraitEntry>(all.map((d) => [d.id, d]));
  return {
    all,
    get(id) {
      return map.get(id);
    },
  };
}

/**
 * Default trait registry.
 */
export const TraitRegistryDefault: t.TraitRegistry = makeRegistry([
  { id: 'video-player', propsSchema: VideoPlayerPropsSchema },
  { id: 'video-recorder', propsSchema: VideoRecorderPropsSchema },
]);
