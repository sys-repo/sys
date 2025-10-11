import { VideoPlayerPropsSchema, VideoRecorderPropsSchema } from '../schema.traits/mod.ts';
import type { t } from './common.ts';
import { makeRegistry } from './u.ts';

/**
 * Default trait registry.
 */
export const TraitRegistryDefault: t.TraitRegistry = makeRegistry([
  { id: 'video-player', propsSchema: VideoPlayerPropsSchema },
  { id: 'video-recorder', propsSchema: VideoRecorderPropsSchema },
]);
