import { type t } from './common.ts';

import { SlugTreePropsSchema } from '../schema.traits/schema.slug.tree.ts';
import { VideoPlayerPropsSchema } from '../schema.traits/schema.video.player.ts';
import { VideoRecorderPropsSchema } from '../schema.traits/schema.video.recorder.ts';

/**
 * Default schema registry.
 */
export const RegistryDefault: t.SchemaTraitRegistry = {
  get all() {
    return [
      { id: 'slug-tree', propsSchema: SlugTreePropsSchema },
      { id: 'video-recorder', propsSchema: VideoRecorderPropsSchema },
      { id: 'video-player', propsSchema: VideoPlayerPropsSchema },
    ] as const;
  },
  get(id) {
    return RegistryDefault.all.find((e) => e.id === id);
  },
};
