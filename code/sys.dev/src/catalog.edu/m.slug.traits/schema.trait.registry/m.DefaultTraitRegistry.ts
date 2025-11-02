import { type t, Slug } from './common.ts';

import { VideoPlayerPropsSchema } from '../traits.schema/schema.video-player.ts';
import { VideoRecorderPropsSchema } from '../traits.schema/schema.video-recorder.ts';
import { ViewRendererPropsSchema } from '../traits.schema/schema.view-renderer.ts';

/**
 * Default schema registry.
 */
export const DefaultTraitRegistry: t.SchemaTraitRegistry = {
  get(id) {
    return DefaultTraitRegistry.all.find((e) => e.id === id);
  },
  get all() {
    return [
      { id: 'slug-tree', propsSchema: Slug.Schema.Slug.Tree.Props },
      { id: 'video-recorder', propsSchema: VideoRecorderPropsSchema },
      { id: 'video-player', propsSchema: VideoPlayerPropsSchema },
      { id: 'view-renderer', propsSchema: ViewRendererPropsSchema },
    ] as const;
  },
};
